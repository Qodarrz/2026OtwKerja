import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['access_token'] || request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Access token not found');
    }

    try {
      // Basic Passport-JWT check
      const isValid = await super.canActivate(context);
      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired access token');
      }

      // Strict validation against Database Session Table
      const session = await this.prisma.session.findUnique({
        where: { token },
      });

      if (!session || new Date() > session.expiresAt) {
        throw new UnauthorizedException('Session expired or invalid');
      }

      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
