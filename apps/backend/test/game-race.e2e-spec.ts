import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { AddressInfo } from 'node:net';
import { ConversationStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/common/prisma/prisma.service';

interface AuthResponse {
  accessToken: string;
  user: { id: string };
}

interface GameResponse {
  game: {
    id: string;
    completedAt: string | null;
  };
}

describe('ChatGame concurrent-answer race condition (PostgreSQL e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  const createdUserIds: string[] = [];
  const createdConversationIds: string[] = [];

  beforeAll(async () => {
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: false,
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
  });

  afterAll(async () => {
    if (createdConversationIds.length > 0) {
      await prisma.conversation.deleteMany({
        where: { id: { in: createdConversationIds } },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }

    await app.close();
  });

  it('completes the game exactly once and triggers one stage transition under concurrent answers', async () => {
    const suffix = String(Date.now()) + '_' + Math.random().toString(36).slice(2, 8);

    const userA = await register(`race043a_${suffix}`, `race043a-${suffix}@example.test`);
    const userB = await register(`race043b_${suffix}`, `race043b-${suffix}@example.test`);
    createdUserIds.push(userA.user.id, userB.user.id);

    const now = new Date();

    const conversation = await prisma.conversation.create({
      data: {
        status: ConversationStatus.active,
        stage: 1,
        stage1StartedAt: now,
        stageUpdatedAt: now,
        participants: {
          create: [
            { userId: userA.user.id, joinedAt: now },
            { userId: userB.user.id, joinedAt: now },
          ],
        },
      },
    });
    createdConversationIds.push(conversation.id);

    // Pre-create one completed stage-1 game so the race game becomes the 2nd completed
    // and triggers the stage 1 → 2 transition.
    await prisma.chatGame.create({
      data: {
        conversationId: conversation.id,
        stage: 1,
        gameType: 'question',
        question: 'Pre-completed question — task 043 race setup?',
        shownAt: now,
        completedAt: now,
        answers: {
          create: [
            { userId: userA.user.id, answer: 'pre-answer A', answeredAt: now },
            { userId: userB.user.id, answer: 'pre-answer B', answeredAt: now },
          ],
        },
      },
    });

    const raceGame = await prisma.chatGame.create({
      data: {
        conversationId: conversation.id,
        stage: 1,
        gameType: 'question',
        question: 'Race condition test question — task 043?',
        shownAt: now,
      },
    });

    // Submit both answers in parallel — this is the concurrent race.
    const [resultA, resultB] = await Promise.all([
      answerGame(userA.accessToken, conversation.id, raceGame.id, 'answer A'),
      answerGame(userB.accessToken, conversation.id, raceGame.id, 'answer B'),
    ]);

    // Both requests must succeed.
    expect(resultA.game.id).toBe(raceGame.id);
    expect(resultB.game.id).toBe(raceGame.id);

    // Game must be marked complete exactly once in the DB.
    const finalGame = await prisma.chatGame.findUniqueOrThrow({
      where: { id: raceGame.id },
      select: { completedAt: true },
    });
    expect(finalGame.completedAt).not.toBeNull();

    // Exactly two game answers must exist — no duplicates, no missing rows.
    const answerCount = await prisma.gameAnswer.count({
      where: { gameId: raceGame.id },
    });
    expect(answerCount).toBe(2);

    // Stage must have advanced to 2 (two completed stage-1 games).
    const finalConversation = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      select: { stage: true },
    });
    expect(finalConversation.stage).toBe(2);

    // Exactly one system message must have been created for the transition.
    const systemMessageCount = await prisma.message.count({
      where: { conversationId: conversation.id, isSystemMessage: true },
    });
    expect(systemMessageCount).toBe(1);
  });

  async function register(handle: string, email: string): Promise<AuthResponse> {
    return requestJson<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Synthetic-password-043',
        handle,
        displayName: handle,
        birthDate: '1995-05-15',
      }),
    });
  }

  async function answerGame(
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
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ answer }),
      },
    );
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
