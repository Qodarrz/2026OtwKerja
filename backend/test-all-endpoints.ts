import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const jwtService = app.get(JwtService);
  const prisma = app.get(PrismaService);
  
  const admin = await prisma.user.findFirst({
    where: { roles: { has: 'ADMIN' } }
  });

  const token = jwtService.sign({
    userId: admin!.id,
    sub: admin!.id,
    email: admin!.email,
    roles: admin!.roles
  }, { secret: 'ucupkebabpakez1' });

  console.log("Testing endpoints...");

  for (const endpoint of ['/analytics/dashboard', '/analytics/bottlenecks', '/analytics/audit-logs?limit=5']) {
    try {
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`\n--- ${endpoint} ---`);
      console.log(`Status: ${res.status}`);
      console.log(`Body: ${await res.text()}`);
    } catch(e) {
      console.error(`Error on ${endpoint}:`, e.message);
    }
  }
  
  await app.close();
}
main();
