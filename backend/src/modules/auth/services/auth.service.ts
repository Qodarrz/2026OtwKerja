import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ResendOtpDto,
} from '../dto/auth.dto';
import { AuthProvider, Role } from '@prisma/client';
import { MailerService } from '../../mailer/services/mailer.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  AuditEntityType,
  AuditActionType,
} from '../../audit-log/dto/audit-log.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private auditLogService: AuditLogService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(dto: RegisterDto) {
    try {
      const existing = await this.usersService.findByEmail(dto.email);

      if (existing) {
        if (existing.verify_gmail) {
          throw new ConflictException('Email already in use and verified');
        }
        // If not verified, we allow resending OTP
        return this.resendOtp({ email: dto.email });
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const otp = this.generateOtp();
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 10);

      // Using transaction to ensure all records are created
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            name: dto.name,
            password: hashedPassword,
            provider: AuthProvider.LOCAL,
            verify_gmail: false,
            roles: [Role.USER],
            userDetail: {
              create: {},
            },
            otpVerification: {
              create: {
                otp_code: otp,
                otp_expires_at: otpExpires,
                otp_attempts: 1,
                last_otp_requested_at: new Date(),
              },
            },
          },
          include: {
            otpVerification: true,
            userDetail: true,
          },
        });

        return user;
      });

      await this.mailerService.sendOtpEmail(result.email, otp);

      const payload = { 
        sub: result.id, 
        email: result.email, 
        roles: result.roles, 
        isVerified: false,
        isKtpVerified: false 
      };
      const token = this.jwtService.sign(payload);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.session.create({
        data: {
          userId: result.id,
          token: token,
          expiresAt: expiresAt,
        },
      });

      const { password: _password, ...userWithoutPassword } = result;
      return {
        message:
          'Registration successful. Please check your email for verification code.',
        access_token: token,
        user: {
          ...userWithoutPassword,
          isKtpVerified: false,
        },
      };
    } catch (error) {
      console.error('[AuthService] Registration error:', error);
      if (error instanceof ConflictException) throw error;
      throw error;
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { otpVerification: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.verify_gmail) {
      return { message: 'Email already verified' };
    }

    const otpData = user.otpVerification;
    if (!otpData) {
      throw new BadRequestException('No OTP requested');
    }

    if (new Date() > otpData.otp_expires_at) {
      throw new BadRequestException('OTP expired');
    }

    if (otpData.otp_code !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { verify_gmail: true },
      }),
      this.prisma.otpVerification.delete({
        where: { userId: user.id },
      }),
      this.prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    const payload = { 
      sub: user.id, 
      email: user.email, 
      roles: user.roles, 
      isVerified: true,
      isKtpVerified: user.isKtpVerified 
    };
    const token = this.jwtService.sign(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: expiresAt,
      },
    });

    return { 
      message: 'Email verified successfully',
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        verify_gmail: true,
        isKtpVerified: user.isKtpVerified,
      }
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { otpVerification: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.verify_gmail) {
      throw new ConflictException('Email already verified');
    }

    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    let attempts = user.otpVerification?.otp_attempts || 0;
    if (
      user.otpVerification?.last_otp_requested_at &&
      user.otpVerification.last_otp_requested_at < threeHoursAgo
    ) {
      attempts = 0;
    }

    if (attempts >= 3) {
      throw new ForbiddenException(
        'Too many attempts. Please try again in 3 hours.',
      );
    }

    const otp = this.generateOtp();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    await this.prisma.otpVerification.upsert({
      where: { userId: user.id },
      update: {
        otp_code: otp,
        otp_expires_at: otpExpires,
        otp_attempts: attempts + 1,
        last_otp_requested_at: now,
      },
      create: {
        userId: user.id,
        otp_code: otp,
        otp_expires_at: otpExpires,
        otp_attempts: 1,
        last_otp_requested_at: now,
      },
    });

    await this.mailerService.sendOtpEmail(user.email, otp);

    return { message: 'OTP resent successfully. Please check your email.' };
  }

  async login(dto: LoginDto) {
    const loginStartTime = new Date();
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please login with Google');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      roles: user.roles, 
      isVerified: user.verify_gmail,
      isKtpVerified: (user as any).isKtpVerified 
    };

    const token = this.jwtService.sign(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: expiresAt,
      },
    });

    // Create audit log for login
    await this.auditLogService.createAuditLog({
      entityType: AuditEntityType.USER,
      entityId: user.id,
      action: AuditActionType.LOGIN,
      performedBy: user.id,
      changes: {
        authenticationMethod: 'LOCAL',
        loginTime: loginStartTime,
        email: user.email,
      },
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        verify_gmail: user.verify_gmail,
        isKtpVerified: (user as any).isKtpVerified,
      },
    };
  }

  async validateOAuthUser(details: {
    email: string;
    name: string;
    provider: AuthProvider;
    providerId: string;
  }) {
    const loginStartTime = new Date();
    let user = await this.prisma.user.findUnique({
      where: { email: details.email },
      include: { userDetail: true },
    });

    if (user) {
      if (user.provider !== details.provider) {
        user = await this.prisma.user.update({
          where: { email: details.email },
          data: {
            provider: details.provider,
            providerId: details.providerId,
            verify_gmail: true,
          },
          include: { userDetail: true },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: details.email,
          name: details.name,
          provider: details.provider,
          providerId: details.providerId,
          verify_gmail: true, // Auto-verify email for Google Auth
          roles: [Role.USER],
          userDetail: {
            create: {},
          },
        },
        include: { userDetail: true },
      });
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      roles: user.roles, 
      isVerified: user.verify_gmail,
      isKtpVerified: (user as any).isKtpVerified 
    };

    const token = this.jwtService.sign(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: expiresAt,
      },
    });

    // Create audit log for OAuth login
    await this.auditLogService.createAuditLog({
      entityType: AuditEntityType.USER,
      entityId: user.id,
      action: AuditActionType.LOGIN,
      performedBy: user.id,
      changes: {
        authenticationMethod: details.provider,
        loginTime: loginStartTime,
        email: user.email,
        providerId: details.providerId,
      },
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        verify_gmail: user.verify_gmail,
        isKtpVerified: (user as any).isKtpVerified,
      },
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userDetail: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password: _password, ...result } = user;
    return result;
  }

  async logout(token: string) {
    if (!token) return { message: 'Logged out successfully' };

    const logoutTime = new Date();
    
    // Get session to find user and calculate session duration
    const session = await this.prisma.session.findFirst({
      where: { token },
      include: { user: true },
    });

    await this.prisma.session.deleteMany({
      where: { token },
    });

    // Create audit log for logout if session was found
    if (session) {
      const sessionDuration = Math.floor(
        (logoutTime.getTime() - session.createdAt.getTime()) / 1000 / 60, // minutes
      );

      await this.auditLogService.createAuditLog({
        entityType: AuditEntityType.USER,
        entityId: session.userId,
        action: AuditActionType.LOGOUT,
        performedBy: session.userId,
        changes: {
          logoutTime,
          sessionDurationMinutes: sessionDuration,
          email: session.user.email,
        },
      });
    }

    return { message: 'Logged out successfully' };
  }
}
