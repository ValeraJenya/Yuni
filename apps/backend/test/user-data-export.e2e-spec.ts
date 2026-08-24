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

interface LikeResponse {
  match?: { id: string };
}

interface ConversationResponse {
  conversation: { conversationId: string };
}

interface DataExport {
  schemaVersion: number;
  exportedAt: string;
  account: Record<string, unknown>;
  profile: Record<string, unknown> | null;
  photos: unknown[];
  interests: unknown[];
  sessions: Array<Record<string, unknown>>;
  likesSent: Array<{ likedUserId: string }>;
  matches: Array<{ otherUserId: string }>;
  conversations: Array<{ conversationId: string; voiceTotalSec: number }>;
  messages: Array<{ text: string; conversationId: string }>;
  gameAnswers: unknown[];
  blocksIssued: unknown[];
  reportsFiled: unknown[];
  privacySettings: Record<string, unknown> | null;
  notificationSettings: Record<string, unknown> | null;
  notifications: unknown[];
}

const OWN_MESSAGE = 'Synthetic message written by the exporting user';
const OTHER_MESSAGE = 'Synthetic message written by the other participant';

describe('user data export (PostgreSQL e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let rateLimitService: RateLimitService;
  let baseUrl: string;
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
  });

  beforeEach(() => {
    // auth.register.ip допускает 3/час, users.dataExport.ip — 10/час.
    // Оба лимитера общие на instance, поэтому сбрасываем перед каждым тестом.
    rateLimitService.reset();
  });

  afterAll(async () => {
    try {
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
    } finally {
      await app.close();
    }
  });

  it('exports the own side of a conversation and never the other participant messages', async () => {
    const { userA, userB, conversationId } = await createChattingPair('export');

    await sendText(userA.accessToken, conversationId, OWN_MESSAGE);
    await sendText(userB.accessToken, conversationId, OTHER_MESSAGE);

    const data = await exportFor(userA.accessToken);

    // Собственная реплика на месте.
    const texts = data.messages.map((message) => message.text);
    expect(texts).toContain(OWN_MESSAGE);

    // Реплика собеседника — нет. Это главный инвариант задачи: экспорт не
    // должен становиться способом выгрузить чужие персональные данные под
    // видом «контекста диалога».
    expect(texts).not.toContain(OTHER_MESSAGE);
    expect(data.messages).toHaveLength(1);

    // Диалог при этом виден — без него собственные реплики висели бы в воздухе.
    expect(
      data.conversations.map((conversation) => conversation.conversationId),
    ).toContain(conversationId);
  });

  it('never returns password or refresh token material at any depth', async () => {
    const { userA } = await createChattingPair('secrets');

    const raw = await exportRawFor(userA.accessToken);
    const data = JSON.parse(raw) as DataExport;

    // Проверка по ключам сериализованного ответа, а не глазами по секциям.
    for (const forbidden of [
      'passwordHash',
      'tokenHash',
      'storageKey',
      'anonymousAvatarKey',
      'revokedReason',
      'resolutionNote',
    ]) {
      expect(collectKeys(data)).not.toContain(forbidden);
    }

    // И по подстроке в сыром теле — на случай, если значение утечёт под другим
    // именем ключа.
    expect(raw).not.toContain('$argon2');

    // Сессии при этом выгружаются: IP и User-Agent пишутся при каждом логине,
    // человек их нигде не видит, и место им ровно здесь.
    expect(data.sessions.length).toBeGreaterThan(0);
    expect(data.sessions[0]).toHaveProperty('ipAddress');
    expect(data.sessions[0]).toHaveProperty('userAgent');
  });

  it('shows the other user only as a bare uuid, never as a profile', async () => {
    const { userA, userB } = await createChattingPair('uuidonly');

    const data = await exportFor(userA.accessToken);

    expect(data.matches.map((match) => match.otherUserId)).toContain(
      userB.user.id,
    );
    // Ни в одной секции нет чужого handle или displayName.
    const raw = JSON.stringify(data);
    const otherProfile = await prisma.profile.findUniqueOrThrow({
      where: { userId: userB.user.id },
      select: { handle: true, displayName: true },
    });
    expect(raw).not.toContain(otherProfile.handle);
    expect(raw).not.toContain(otherProfile.displayName);
  });

  it('returns every declared section even when the user has no data in it', async () => {
    const { userA } = await createChattingPair('sections');

    const data = await exportFor(userA.accessToken);

    expect(data.schemaVersion).toBe(1);
    expect(typeof data.exportedAt).toBe('string');
    // Пустые секции присутствуют, а не опускаются: отсутствие данных — тоже
    // ответ на вопрос «что вы обо мне храните».
    expect(data.interests).toEqual([]);
    expect(data.blocksIssued).toEqual([]);
    expect(data.reportsFiled).toEqual([]);
    expect(data.privacySettings).not.toBeNull();
    expect(data.notificationSettings).not.toBeNull();
    expect(data.profile).not.toBeNull();
  });

  it('requires authentication', async () => {
    const response = await fetch(`${baseUrl}/users/me/export`);

    expect(response.status).toBe(401);
  });

  it('rate limits repeated exports by user', async () => {
    const { userA } = await createChattingPair('ratelimit');

    // Политика — 3/час по ключу user. Четвёртый запрос должен быть отклонён.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const allowed = await fetch(`${baseUrl}/users/me/export`, {
        headers: authorization(userA.accessToken),
      });
      expect(allowed.status).toBe(200);
    }

    const blocked = await fetch(`${baseUrl}/users/me/export`, {
      headers: authorization(userA.accessToken),
    });

    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as Record<string, unknown>;
    // Ошибка лимитера не должна раскрывать имя политики или ключ бакета.
    expect(body.message).toBe('Too many requests');
    expect(Object.keys(body)).not.toContain('policy');
  });

  async function createChattingPair(label: string): Promise<{
    userA: AuthResponse;
    userB: AuthResponse;
    conversationId: string;
  }> {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const userA = await register(
      `t067_${suffix}a`,
      `t067-${label}-${suffix}-a@example.test`,
    );
    const userB = await register(
      `t067_${suffix}b`,
      `t067-${label}-${suffix}-b@example.test`,
    );
    createdUserIds.push(userA.user.id, userB.user.id);

    await requestJson<LikeResponse>(`/likes/${userB.user.id}`, {
      method: 'POST',
      headers: authorization(userA.accessToken),
    });
    const reciprocal = await requestJson<LikeResponse>(
      `/likes/${userA.user.id}`,
      {
        method: 'POST',
        headers: authorization(userB.accessToken),
      },
    );
    expect(reciprocal.match).toBeDefined();

    const conversation = await requestJson<ConversationResponse>(
      `/matches/${reciprocal.match!.id}/conversation`,
      {
        method: 'POST',
        headers: authorization(userA.accessToken),
      },
    );

    return {
      userA,
      userB,
      conversationId: conversation.conversation.conversationId,
    };
  }

  function sendText(
    token: string,
    conversationId: string,
    text: string,
  ): Promise<unknown> {
    return requestJson(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        ...authorization(token),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  }

  function register(handle: string, email: string): Promise<AuthResponse> {
    return requestJson<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Synthetic-password-067',
        handle,
        displayName: handle,
        birthDate: '1995-05-15',
      }),
    });
  }

  async function exportRawFor(token: string): Promise<string> {
    const response = await fetch(`${baseUrl}/users/me/export`, {
      headers: authorization(token),
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(`Export failed with ${response.status}: ${raw}`);
    }

    return raw;
  }

  async function exportFor(token: string): Promise<DataExport> {
    return JSON.parse(await exportRawFor(token)) as DataExport;
  }

  async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, init);
    const body = (await response.json()) as T | { message?: string };

    if (!response.ok) {
      throw new Error(
        `Request ${init.method ?? 'GET'} ${path} failed with ${response.status}: ${JSON.stringify(body)}`,
      );
    }

    return body as T;
  }
});

function collectKeys(value: unknown, seen: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, seen);
    }
    return seen;
  }

  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      seen.push(key);
      collectKeys(nested, seen);
    }
  }

  return seen;
}

function authorization(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}
