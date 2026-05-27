import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { JwtService } from '@nestjs/jwt';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const jwtService = app.get(JwtService);
  
  const token = jwtService.sign({
    userId: 'admin-123',
    email: 'admin@test.com',
    roles: ['ADMIN']
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
