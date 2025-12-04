import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN');
  const corsOrigin =
    corsOriginEnv
      ?.split(',')
      .map((v) => v.trim())
      .filter(Boolean) || ['http://localhost:3000'];

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id'],
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT') ?? 3000;
  const authService = app.get(AuthService);
  await authService.seedSuperAdmin().catch(() => undefined);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`ReserveJá API running on port ${port}`);
}

bootstrap();
