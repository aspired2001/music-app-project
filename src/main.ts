// Backend: src/main.ts (NestJS)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // More comprehensive CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',  // Next.js frontend
      'http://localhost:3001'   // Additional frontend port
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept'
    ],
    credentials: true
  });

  // Optional: Global validation pipe for request parameters
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
  console.log('Backend running on http://localhost:3000');
}
bootstrap();