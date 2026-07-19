import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://intasela-frontend.onrender.com',
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-id'],
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
