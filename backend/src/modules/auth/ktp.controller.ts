import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OcrService, KtpData } from './ocr.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth/ktp')
@UseGuards(JwtAuthGuard)
export class KtpController {
  constructor(
    private readonly ocrService: OcrService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadKtp(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('KTP image is required');
      }

      // Run OCR
      const data = await this.ocrService.extractKtpData(file);
      
      // In real app, we would also save the image to storage (S3/local)
      // and return the image URL
      const ktpImageUrl = `https://placehold.co/600x400?text=KTP+${data.nik}`;

      return {
        success: true,
        data: {
          ...data,
          ktpImageUrl,
        },
      };
    } catch (error) {
      console.error('[KtpController] Upload error:', error);
      throw error;
    }
  }

  @Post('confirm')
  async confirmKtp(@Request() req: any, @Body() body: KtpData & { ktpImageUrl: string }) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.isKtpVerified) {
      throw new BadRequestException('KTP already verified and cannot be changed.');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Delete all existing sessions to force new token usage
      await tx.session.deleteMany({
        where: { userId: userId },
      });

      return tx.user.update({
        where: { id: userId },
        data: {
          isKtpVerified: true,
          userDetail: {
            update: {
              nik: body.nik,
              ktpFullName: body.fullName,
              ktpBirthDate: new Date(body.birthDate),
              ktpBirthPlace: body.birthPlace,
              ktpGender: body.gender,
              ktpAddress: body.address,
              ktpImageUrl: body.ktpImageUrl,
            },
          },
        },
      });
    });

    // Generate new token with updated KTP verification status
    const payload = { 
      sub: updatedUser.id, 
      email: updatedUser.email, 
      roles: updatedUser.roles, 
      isVerified: updatedUser.verify_gmail,
      isKtpVerified: true 
    };
    const token = this.jwtService.sign(payload);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId: updatedUser.id,
        token: token,
        expiresAt: expiresAt,
      },
    });

    return {
      success: true,
      message: 'KTP verification successful',
      access_token: token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        roles: updatedUser.roles,
        verify_gmail: updatedUser.verify_gmail,
        isKtpVerified: true,
      },
    };
  }
}
