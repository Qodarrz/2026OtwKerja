import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /**
   * Update user roles (admin only)
   */
  async updateUserRoles(userId: string, roles: Role[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { roles },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * List all staff members (users with staff roles)
   */
  async listStaff() {
    return this.prisma.user.findMany({
      where: {
        roles: {
          hasSome: [
            Role.ADMIN,
            Role.DOCUMENT_VALIDATOR,
            Role.FIELD_INSPECTOR,
            Role.LEGALIZER,
          ],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
