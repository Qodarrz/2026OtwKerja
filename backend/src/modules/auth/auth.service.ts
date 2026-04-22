import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, VerifyOtpDto, ResendOtpDto } from './dto/auth.dto';
import { AuthProvider } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(dto: RegisterDto) {
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
          // Create empty detail
          userDetail: {
            create: {}
          },
          // Create initial OTP record
          otpVerification: {
            create: {
              otp_code: otp,
              otp_expires_at: otpExpires,
              otp_attempts: 1,
              last_otp_requested_at: new Date(),
            }
          }
        },
        include: {
          otpVerification: true,
          userDetail: true
        }
      });

      return user;
    });

    await this.mailerService.sendOtpEmail(result.email, otp);

    const { password: _password, ...userWithoutPassword } = result;
    return {
      message: 'Registration successful. Please check your email for verification code.',
      user: userWithoutPassword,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { otpVerification: true }
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
    ]);

    return { message: 'Email verified successfully' };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { otpVerification: true }
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
    if (user.otpVerification?.last_otp_requested_at && user.otpVerification.last_otp_requested_at < threeHoursAgo) {
      attempts = 0;
    }

    if (attempts >= 3) {
      throw new ForbiddenException('Too many attempts. Please try again in 3 hours.');
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
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please login with Google');
    }

    if (!user.verify_gmail) {
      throw new ForbiddenException('Please verify your email first');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, roles: user.roles };
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
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }

  async validateOAuthUser(details: {
    email: string;
    name: string;
    provider: AuthProvider;
    providerId: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: details.email },
      include: { userDetail: true }
    });

    if (user) {
      if (user.provider !== details.provider) {
        user = await this.prisma.user.update({
          where: { email: details.email },
          data: { 
            provider: details.provider, 
            providerId: details.providerId,
            verify_gmail: true 
          },
          include: { userDetail: true }
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: details.email,
          name: details.name,
          provider: details.provider,
          providerId: details.providerId,
          verify_gmail: true,
          userDetail: {
            create: {}
          }
        },
        include: { userDetail: true }
      });
    }

    const payload = { sub: user.id, email: user.email, roles: user.roles };
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
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userDetail: true }
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password: _password, ...result } = user;
    return result;
  }

  async logout(token: string) {
    await this.prisma.session.deleteMany({
      where: { token },
    });
    return { message: 'Logged out successfully' };
  }
}
