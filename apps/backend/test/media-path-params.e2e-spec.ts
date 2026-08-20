import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { AddressInfo } from 'node:net';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimitService } from '../src/common/rate-limit';

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
  };
}

interface ErrorResponse {
  statusCode: number;
  message: unknown;
}

// Task 060: `photoId` уходит в Prisma как `where: { id }` по uuid-колонке.
// Без ParseUUIDPipe невалидный UUID доходил до Prisma, та бросала P2023,
// AllExceptionsFilter не распознавал его как HttpException и отдавал 500.
const INVALID_PHOTO_ID = 'not-a-uuid';

// Синтаксически корректный UUID, которого заведомо нет в базе. Нужен, чтобы
// доказать, что пайп проверяет формат, а не ломает нормальный путь.
const ABSENT_PHOTO_ID = '00000000-0000-4000-8000-000000000000';

describe('media path params validation (PostgreSQL e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let rateLimitService: RateLimitService;
  let baseUrl: string;
  let accessToken: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: false,
      abortOnError: false,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1');

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
    prisma = app.get(PrismaService);
    rateLimitService = app.get(RateLimitService);

    const auth = await register('mediaparams060', 'media-params-060@example.test');
    accessToken = auth.accessToken;
    createdUserIds.push(auth.user.id);
  });

  beforeEach(() => {
    // media.actions.user допускает 60 запросов в час, но лимитер общий на весь
    // in-process instance — сбрасываем, чтобы тесты не зависели от порядка.
    rateLimitService.reset();
  });

  afterAll(async () => {
    try {
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: {
            id: { in: createdUserIds },
          },
        });
      }
    } finally {
      await app.close();
    }
  });

  it('rejects a malformed photoId on DELETE with 400 instead of 500', async () => {
    const { status, body } = await requestRaw(
      `/media/profile-photos/${INVALID_PHOTO_ID}`,
      { method: 'DELETE' },
    );

    expect(status).toBe(400);
    expect(body.statusCode).toBe(400);
  });

  it('rejects a malformed photoId on PATCH primary with 400 instead of 500', async () => {
    const { status, body } = await requestRaw(
      `/media/profile-photos/${INVALID_PHOTO_ID}/primary`,
      { method: 'PATCH' },
    );

    expect(status).toBe(400);
    expect(body.statusCode).toBe(400);
  });

  it('still reaches the service for a well-formed but unknown photoId', async () => {
    const deleteResponse = await requestRaw(
      `/media/profile-photos/${ABSENT_PHOTO_ID}`,
      { method: 'DELETE' },
    );
    const patchResponse = await requestRaw(
      `/media/profile-photos/${ABSENT_PHOTO_ID}/primary`,
      { method: 'PATCH' },
    );

    // 404, а не 400: формат корректен, пайп пропускает, падает уже assertFound.
    expect(deleteResponse.status).toBe(404);
    expect(patchResponse.status).toBe(404);
  });

  it('keeps the guard ahead of the pipe for unauthenticated requests', async () => {
    const response = await fetch(
      `${baseUrl}/media/profile-photos/${INVALID_PHOTO_ID}`,
      { method: 'DELETE' },
    );

    // Отсутствие токена важнее формата параметра: невалидный UUID не должен
    // превращать 401 в 400 и подсказывать неаутентифицированному клиенту,
    // что именно не так с его запросом.
    expect(response.status).toBe(401);
  });

  async function register(handle: string, email: string): Promise<AuthResponse> {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Synthetic-password-060',
        handle,
        displayName: handle,
        birthDate: '1995-05-15',
      }),
    });

    const body = (await response.json()) as AuthResponse;

    if (!response.ok) {
      throw new Error(
        `Registration failed with ${response.status}: ${JSON.stringify(body)}`,
      );
    }

    return body;
  }

  async function requestRaw(
    path: string,
    init: RequestInit,
  ): Promise<{ status: number; body: ErrorResponse }> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      status: response.status,
      body: (await response.json()) as ErrorResponse,
    };
  }
});
