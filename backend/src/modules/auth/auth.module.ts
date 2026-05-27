import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/guards/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailerModule } from '../mailer/mailer.module';
import { OcrService } from './services/ocr.service';
import { KtpController } from './controllers/ktp.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MailerModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController, KtpController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, OcrService],
  exports: [AuthService],
})
export class AuthModule {}
