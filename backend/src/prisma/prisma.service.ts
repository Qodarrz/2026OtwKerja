import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const useHttp = process.env.USE_HTTP_ADAPTER === 'true';

    if (useHttp) {
      // Bypassing port 5432 firewall by using HTTPS (port 443)
      const pool = new Pool({ connectionString });
      const adapter = new PrismaNeon(pool);
      super({ adapter });
    } else {
      // Standard connection via port 5432
      super();
    }
  }

  async onModuleInit() {
    await this.$connect();
  }
}
