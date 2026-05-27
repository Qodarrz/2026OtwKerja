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

  if (!admin) {
    console.error("No admin found");
    await app.close();
    return;
  }

  const token = jwtService.sign({
    userId: admin.id,
    email: admin.email,
    roles: admin.roles
  });

  try {
    const res = await fetch('http://localhost:3000/analytics/bottlenecks', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const text = await res.text();
    console.log("HTTP Status:", res.status);
    console.log("Response:", text);
  } catch(e) {
    console.error("HTTP Error:", e);
  }
  
  await app.close();
}
main();
