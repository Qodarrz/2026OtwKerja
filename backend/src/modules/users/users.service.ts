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

  /**
   * List all regular users (role USER only)
   */
  async listUsers() {
    return this.prisma.user.findMany({
      where: {
        roles: {
          equals: [Role.USER],
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

  /**
   * Update user details (admin only)
   */
  async updateUser(id: string, data: Partial<User>) {
    return this.prisma.user.update({
      where: { id },
      data,
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
   * Delete user (admin only)
   */
  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(userId: string) {
    let settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.notificationSetting.create({
        data: { userId },
      });
    }

    return settings;
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(userId: string, data: any) {
    return this.prisma.notificationSetting.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  }

  /**
   * Get user profile with details
   */
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isKtpVerified: true,
        createdAt: true,
        userDetail: true,
      },
    });
  }

  /**
   * Update my profile
   */
  async updateMyProfile(userId: string, data: { phone?: string, address?: string }) {
    const updateData: any = {};
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        userDetail: {
          upsert: {
            create: updateData,
            update: updateData
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isKtpVerified: true,
        createdAt: true,
        userDetail: true,
      }
    });
  }

  /**
   * Get user activity history from audit logs
   */
  async getActivityHistory(userId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        performedBy: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }
}
