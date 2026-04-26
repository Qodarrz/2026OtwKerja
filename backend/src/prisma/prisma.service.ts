import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    const extendedClient = this.$extends({
      query: {
        auditLog: {
          update: () => {
            throw new Error('Audit logs are immutable and cannot be updated.');
          },
          updateMany: () => {
            throw new Error('Audit logs are immutable and cannot be updated.');
          },
          delete: () => {
            throw new Error('Audit logs are immutable and cannot be deleted.');
          },
          deleteMany: () => {
            throw new Error('Audit logs are immutable and cannot be deleted.');
          },
        },
      },
    });

    // Ensure onModuleInit is called on the extended client by NestJS
    (extendedClient as any).onModuleInit = async () => {
      await (extendedClient as any).$connect();
    };

    return extendedClient as any;
  }

  async onModuleInit() {
    await (this as any).$connect();
  }
}
