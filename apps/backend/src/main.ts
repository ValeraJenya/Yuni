import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { buildAllowedOrigins } from './config/cors';
import {
  PROFILE_PHOTO_PUBLIC_PATH,
  PROFILE_PHOTO_UPLOAD_DIR,
} from './modules/media/media.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('app.port');
  const frontendUrl = configService.getOrThrow<string>('app.frontendUrl');
  const rawOrigins = configService.get<string>('app.corsAllowedOrigins');
  const allowedOrigins = buildAllowedOrigins(frontendUrl, rawOrigins);

  app.use(helmet());
  app.useStaticAssets(join(process.cwd(), PROFILE_PHOTO_UPLOAD_DIR), {
    fallthrough: false,
    index: false,
    maxAge: '1h',
    prefix: PROFILE_PHOTO_PUBLIC_PATH,
    setHeaders(response) {
      response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
  app.use(cookieParser());
  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin is not allowed'), false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port);
}

void bootstrap();
