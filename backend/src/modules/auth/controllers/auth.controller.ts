import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  RegisterDto,  
  LoginDto,
  VerifyOtpDto,
  ResendOtpDto,
} from '../dto/auth.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = (await this.authService.register(dto)) as any;
    if (result && result.access_token) {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }
    return result;
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = (await this.authService.verifyOtp(dto)) as any;
    if (result && result.access_token) {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }
    return result;
  }

  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(dto);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
    return result;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Request() req: any) {
    // This triggers the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req: any, @Res() res: Response) {
    // req.user contains the validated user from GoogleStrategy
    const { access_token } = req.user;

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Redirect to frontend with token in URL (fixes cross-origin SameSite cookie drop on first load)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/callback?token=${access_token}`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    // req.user contains { userId: id, email: email } from JwtStrategy
    const user = await this.authService.getUserProfile(req.user.userId);
    return user;
  }

  @Post('logout')
  async logout(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const token = req.cookies?.['access_token'] || req.headers.authorization?.split(' ')[1];
    
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    return this.authService.logout(token);
  }
}
