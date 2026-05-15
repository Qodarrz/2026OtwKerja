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
    try {
      // Basic Passport-JWT check
      const isValid = await super.canActivate(context);
      if (!isValid) return false;

      const request = context.switchToHttp().getRequest();
      const token = request.cookies?.['access_token'] || request.headers.authorization?.split(' ')[1];

      if (!token) return false;

      // Strict validation against Database Session Table
      const session = await this.prisma.session.findUnique({
        where: { token },
      });

      if (!session || new Date() > session.expiresAt) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }
}
