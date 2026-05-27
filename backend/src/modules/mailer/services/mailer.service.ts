import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
    const port = parseInt(this.configService.get<string>('MAIL_PORT') || '587', 10);
    const user = this.configService.get<string>('MAIL_USER') || '';
    
    console.log(`[Mailer] Attempting to connect to ${host}:${port} as ${user}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.configService.get('MAIL_SECURE') === 'true',
      auth: {
        user,
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendOtpEmail(email: string, otp: string) {
    const mailOptions = {
      from: `"Support" <${this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('MAIL_USER')}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Thank you for registering! Please use the following code to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      // We don't throw here to avoid blocking the registration flow if mail fails in dev
      // but in production you might want to handle this differently
    }
  }
}
