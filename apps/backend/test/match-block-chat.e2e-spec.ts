import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Conversation, Match } from '@prisma/client';
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
  match?: MatchResponse;
}

interface MatchResponse {
  id: string;
  conversationId: string | null;
  conversationStarted: boolean;
  status: string;
}

interface ConversationResponse {
  conversation: {
    conversationId: string;
    status: string;
  };
}

interface ConversationsResponse {
  conversations: Array<{
    conversationId: string;
    status: string;
  }>;
}

interface MessageResponse {
  message: {
    id: string;
    conversationId: string;
    senderUserId: string | null;
    text: string;
    voiceDurationSec?: number;
  };
}

interface MessagesResponse {
  messages: Array<{
    id: string;
    text: string;
    senderUserId: string | null;
    voiceDurationSec?: number;
  }>;
}

interface StageResponse {
  stage: number;
  voiceLimits: {
    currentUserTotalSec: number;
    maxRecordTimeSec: number | null;
    totalLimitSec: number | null;
  };
}

interface GameResponse {
  game: {
    id: string;
    completedAt: string | null;
  };
}

describe('match block chat lifecycle (PostgreSQL e2e)', () => {
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
    // Each test case registers 1-2 users against the same in-process
    // RateLimitService instance (auth.register.ip allows only 3/hour).
    // Without resetting between test cases, the 3rd+ registration in this
    // file would be rejected with 429 regardless of correctness.
    rateLimitService.reset();
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: { in: createdUserIds },
        },
      });
    }

    await app.close();
  });

  it('creates a match, starts chat, closes it on block, and keeps it closed after unblock', async () => {
    const { userA, userB } = await createPair('journey');
    const match = await createMatch(userA, userB);
    const conversation = await startConversation(userA.accessToken, match.id);

    await sendText(userA.accessToken, conversation.conversationId, 'hello from A');
    await sendText(userB.accessToken, conversation.conversationId, 'hello from B');

    const messages = await requestJson<MessagesResponse>(
      `/chat/conversations/${conversation.conversationId}/messages`,
      { headers: authorization(userA.accessToken) },
    );
    // GET /messages returns chronological order (oldest first) — chat.service.ts's
    // getMessages() queries desc for pagination purposes internally, then reverses
    // the page before returning it, matching how the frontend renders the thread.
    expect(messages.messages.map((message) => message.text)).toEqual([
      'hello from A',
      'hello from B',
    ]);

    await expectConversationListed(userA.accessToken, conversation.conversationId, true);
    await requestJson(`/blocks/${userB.user.id}`, {
      method: 'POST',
      headers: authorization(userA.accessToken),
    });

    await expectConversationListed(userA.accessToken, conversation.conversationId, false);
    await expectStatus(
      `/chat/conversations/${conversation.conversationId}/messages`,
      { headers: authorization(userA.accessToken) },
      404,
    );
    await expectStatus(
      `/chat/conversations/${conversation.conversationId}/messages`,
      { headers: authorization(userB.accessToken) },
      404,
    );
    expect(await activeMatchCount(userA.user.id, userB.user.id)).toBe(0);
    expect(
      await prisma.conversation.findUniqueOrThrow({
        where: { id: conversation.conversationId },
        select: { status: true },
      }),
    ).toMatchObject({ status: 'closed' });

    await requestJson(`/blocks/${userB.user.id}`, {
      method: 'DELETE',
      headers: authorization(userA.accessToken),
    });
    await expectConversationListed(userA.accessToken, conversation.conversationId, false);
    await expectStatus(
      `/chat/conversations/${conversation.conversationId}/messages`,
      { headers: authorization(userA.accessToken) },
      404,
    );
  });

  // Task 042 landed: blockUser and tryCreateMatchFromLike both take a
  // pg_advisory_xact_lock on the normalized user pair, so whichever commits
  // first is visible to the other. Either the block wins and no match is
  // created, or the match wins and endActiveMatchesBetween closes it.
  it('does not leave an active match when reciprocal like races with block', async () => {
    const { userA, userB } = await createPair('block_race');
    await requestJson(`/likes/${userB.user.id}`, {
      method: 'POST',
      headers: authorization(userA.accessToken),
    });

    const [likeResult, blockResult] = await Promise.allSettled([
      requestJson<LikeResponse>(`/likes/${userA.user.id}`, {
        method: 'POST',
        headers: authorization(userB.accessToken),
      }),
      requestJson(`/blocks/${userB.user.id}`, {
        method: 'POST',
        headers: authorization(userA.accessToken),
      }),
    ]);

    expect(likeResult.status).toBe('fulfilled');
    expect(blockResult.status).toBe('fulfilled');
    expect(await activeMatchCount(userA.user.id, userB.user.id)).toBe(0);
  });

  it('completes a game when both first answers arrive concurrently', async () => {
    const { userA, userB, conversation } = await createConversation('game_race');
    const game = await prisma.chatGame.create({
      data: {
        conversationId: conversation.id,
        stage: 1,
        gameType: 'question',
        question: `Synthetic race question ${Date.now()}`,
      },
      select: { id: true },
    });

    const [answerA, answerB] = await Promise.allSettled([
      answerGame(userA.accessToken, conversation.id, game.id, 'A answer'),
      answerGame(userB.accessToken, conversation.id, game.id, 'B answer'),
    ]);

    expect(answerA.status).toBe('fulfilled');
    expect(answerB.status).toBe('fulfilled');
    expect(await prisma.gameAnswer.count({ where: { gameId: game.id } })).toBe(2);
    expect(
      await prisma.chatGame.findUniqueOrThrow({
        where: { id: game.id },
        select: { completedAt: true },
      }),
    ).toMatchObject({ completedAt: expect.any(Date) });
  });

  it('keeps concurrent stage-2 voice messages within the 90 second user limit', async () => {
    const { userA, conversation } = await createConversation('voice_race');
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        stage: 2,
        stage2StartedAt: new Date(),
        stageUpdatedAt: new Date(),
        user1VoiceTotalSec: 0,
        user2VoiceTotalSec: 0,
      },
    });

    const [first, second] = await Promise.all([
      sendVoice(userA.accessToken, conversation.id, 'voice one', 60),
      sendVoice(userA.accessToken, conversation.id, 'voice two', 60),
    ]);
    const durations = [first.message.voiceDurationSec, second.message.voiceDurationSec];

    expect(durations.sort((left, right) => left! - right!)).toEqual([30, 60]);
    const stage = await requestJson<StageResponse>(
      `/chat/conversations/${conversation.id}/stage`,
      { headers: authorization(userA.accessToken) },
    );
    expect(stage.voiceLimits).toMatchObject({
      currentUserTotalSec: 90,
      maxRecordTimeSec: 0,
      totalLimitSec: 90,
    });
  });

  async function createPair(label: string): Promise<{
    userA: AuthResponse;
    userB: AuthResponse;
  }> {
    // Handles must be <=30 chars (see RegisterDto), so the unique suffix stays
    // short and label-free here — the descriptive label only goes into the
    // email, which has no such length limit.
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const userA = await register(`t053_${suffix}a`, `t053-${label}-${suffix}-a@example.test`);
    const userB = await register(`t053_${suffix}b`, `t053-${label}-${suffix}-b@example.test`);
    createdUserIds.push(userA.user.id, userB.user.id);
    return { userA, userB };
  }

  async function createConversation(label: string): Promise<{
    userA: AuthResponse;
    userB: AuthResponse;
    match: Match;
    conversation: Conversation;
  }> {
    const { userA, userB } = await createPair(label);
    const matchResponse = await createMatch(userA, userB);
    await startConversation(userA.accessToken, matchResponse.id);
    const match = await prisma.match.findUniqueOrThrow({
      where: { id: matchResponse.id },
    });
    const conversation = await prisma.conversation.findUniqueOrThrow({
      where: { matchId: match.id },
    });

    return { userA, userB, match, conversation };
  }

  async function createMatch(
    userA: AuthResponse,
    userB: AuthResponse,
  ): Promise<MatchResponse> {
    await requestJson<LikeResponse>(`/likes/${userB.user.id}`, {
      method: 'POST',
      headers: authorization(userA.accessToken),
    });
    const reciprocal = await requestJson<LikeResponse>(`/likes/${userA.user.id}`, {
      method: 'POST',
      headers: authorization(userB.accessToken),
    });

    expect(reciprocal.match).toBeDefined();
    return reciprocal.match!;
  }

  async function startConversation(
    token: string,
    matchId: string,
  ): Promise<{ conversationId: string; status: string }> {
    const response = await requestJson<ConversationResponse>(
      `/matches/${matchId}/conversation`,
      {
        method: 'POST',
        headers: authorization(token),
      },
    );

    return response.conversation;
  }

  async function register(handle: string, email: string): Promise<AuthResponse> {
    return requestJson<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Synthetic-password-053',
        handle,
        displayName: handle,
        birthDate: '1995-05-15',
      }),
    });
  }

  function sendText(
    token: string,
    conversationId: string,
    text: string,
  ): Promise<MessageResponse> {
    return requestJson<MessageResponse>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        ...authorization(token),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  }

  function sendVoice(
    token: string,
    conversationId: string,
    text: string,
    voiceDurationSec: number,
  ): Promise<MessageResponse> {
    return requestJson<MessageResponse>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        ...authorization(token),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ text, messageType: 'voice', voiceDurationSec }),
    });
  }

  function answerGame(
    token: string,
    conversationId: string,
    gameId: string,
    answer: string,
  ): Promise<GameResponse> {
    return requestJson<GameResponse>(
      `/chat/conversations/${conversationId}/game/${gameId}/answer`,
      {
        method: 'POST',
        headers: {
          ...authorization(token),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ answer }),
      },
    );
  }

  async function expectConversationListed(
    token: string,
    conversationId: string,
    expected: boolean,
  ): Promise<void> {
    const response = await requestJson<ConversationsResponse>('/chat/conversations', {
      headers: authorization(token),
    });
    const conversationIds = response.conversations.map(
      (conversation) => conversation.conversationId,
    );

    if (expected) {
      expect(conversationIds).toContain(conversationId);
    } else {
      expect(conversationIds).not.toContain(conversationId);
    }
  }

  function activeMatchCount(leftUserId: string, rightUserId: string): Promise<number> {
    return prisma.match.count({
      where: {
        status: 'active',
        expiresAt: { gt: new Date() },
        OR: [
          { userAId: leftUserId, userBId: rightUserId },
          { userAId: rightUserId, userBId: leftUserId },
        ],
      },
    });
  }

  async function expectStatus(
    path: string,
    init: RequestInit,
    expectedStatus: number,
  ): Promise<void> {
    const response = await fetch(`${baseUrl}${path}`, init);
    await response.text();
    expect(response.status).toBe(expectedStatus);
  }

  async function requestJson<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
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

function authorization(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}
