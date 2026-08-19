import {
  ConversationStatus,
  LikeKind,
  MatchStatus,
  MessageStatus,
  type Match,
  type PrismaClient,
} from '@prisma/client';
import type { SeedPersona } from './personas';

const MATCH_VALIDITY_DAYS = 90;

// Mirrors GAME_QUESTIONS in chat.service.ts (private to that module, so the
// strings are duplicated here — not the game logic itself). Reusing the real
// wording keeps the seeded games from repeating once real gameplay resumes,
// since chat.service.ts de-dupes on question text per conversation.
const GAME_QUESTION_1 = 'Что у тебя обычно моментально поднимает настроение?';
const GAME_QUESTION_2 = 'Какой маленький ритуал делает твой день лучше?';
const GAME_QUESTION_3 = 'О каком месте ты чаще всего вспоминаешь с улыбкой?';

// Mirrors STAGE_1_TO_2_MESSAGE in chat.service.ts — cosmetic system-message
// copy, not policy, so duplicating the literal is fine.
const STAGE_1_TO_2_MESSAGE =
  '🎉 Вы хорошо познакомились! Теперь доступны голосовые сообщения';

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function addDays(base: Date, days: number): Date {
  return addHours(base, days * 24);
}

function mustGet(personas: Map<string, SeedPersona>, key: string): SeedPersona {
  const persona = personas.get(key);

  if (!persona) {
    throw new Error(`Seed personas map is missing "${key}" — run seedUsers first.`);
  }

  return persona;
}

async function ensureMutualLikes(
  prisma: PrismaClient,
  aId: string,
  bId: string,
  createdAt: Date,
): Promise<void> {
  const expiresAt = addDays(createdAt, MATCH_VALIDITY_DAYS);
  const now = new Date();
  const directions: Array<[string, string]> = [
    [aId, bId],
    [bId, aId],
  ];

  for (const [likerUserId, likedUserId] of directions) {
    const existing = await prisma.like.findFirst({
      where: {
        likerUserId,
        likedUserId,
        kind: LikeKind.like,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.like.create({
        data: {
          likerUserId,
          likedUserId,
          kind: LikeKind.like,
          createdAt,
          expiresAt,
        },
      });
    }
  }
}

async function ensureActiveMatch(
  prisma: PrismaClient,
  aId: string,
  bId: string,
  matchedAt: Date,
): Promise<Match> {
  const userAId = aId < bId ? aId : bId;
  const userBId = aId < bId ? bId : aId;
  const now = new Date();

  const existing = await prisma.match.findFirst({
    where: { userAId, userBId, status: MatchStatus.active, expiresAt: { gt: now } },
  });

  if (existing) {
    return existing;
  }

  return prisma.match.create({
    data: {
      userAId,
      userBId,
      status: MatchStatus.active,
      matchedAt,
      expiresAt: addDays(matchedAt, MATCH_VALIDITY_DAYS),
    },
  });
}

async function ensureConversationShell(
  prisma: PrismaClient,
  match: Match,
  createdAt: Date,
): Promise<string> {
  const conversation = await prisma.conversation.upsert({
    where: { matchId: match.id },
    update: {},
    create: {
      matchId: match.id,
      status: ConversationStatus.active,
      stage: 1,
      stage1StartedAt: createdAt,
      stageUpdatedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
      participants: {
        create: [
          { userId: match.userAId, joinedAt: createdAt },
          { userId: match.userBId, joinedAt: createdAt },
        ],
      },
    },
  });

  return conversation.id;
}

async function hasMessages(prisma: PrismaClient, conversationId: string): Promise<boolean> {
  const count = await prisma.message.count({ where: { conversationId } });
  return count > 0;
}

interface DialogueLine {
  senderUserId: string;
  body: string;
  hoursOffset: number;
  voiceDurationSec?: number;
}

function toMessageRow(conversationId: string, base: Date, line: DialogueLine) {
  const messageWeight =
    line.voiceDurationSec !== undefined
      ? Math.max(1, Math.floor(line.voiceDurationSec / 15))
      : 1;

  return {
    conversationId,
    senderUserId: line.senderUserId,
    body: line.body,
    voiceDurationSec: line.voiceDurationSec ?? null,
    messageWeight,
    isSystemMessage: false,
    status: MessageStatus.sent,
    createdAt: addHours(base, line.hoursOffset),
  };
}

/**
 * Stage-1 conversation with plain message history: two people who matched
 * and have been chatting, nothing stage-gated to demonstrate.
 */
export async function seedStage1Dialog(
  prisma: PrismaClient,
  personas: Map<string, SeedPersona>,
): Promise<void> {
  const demo = mustGet(personas, 'demo');
  const anna = mustGet(personas, 'anna');
  const matchedAt = addDays(new Date(), -2);

  await ensureMutualLikes(prisma, demo.id, anna.id, matchedAt);
  const match = await ensureActiveMatch(prisma, demo.id, anna.id, matchedAt);
  const conversationId = await ensureConversationShell(prisma, match, matchedAt);

  if (await hasMessages(prisma, conversationId)) {
    return;
  }

  const dialogue: DialogueLine[] = [
    { senderUserId: anna.id, hoursOffset: 0, body: 'Привет! Заметила твою фотографию в горах — тоже обожаю такие маршруты' },
    { senderUserId: demo.id, hoursOffset: 0.3, body: 'Привет! Да, это Эльбрус, ходила туда в прошлом году. Ты тоже в горы ходишь?' },
    { senderUserId: anna.id, hoursOffset: 1, body: 'Регулярно, но чаще по Кавказу. А как тебе вообще формат в приложении — заходишь часто?' },
    { senderUserId: demo.id, hoursOffset: 1.3, body: 'Первую неделю, если честно. Пока нравится больше, чем ожидала' },
    { senderUserId: anna.id, hoursOffset: 5, body: 'Это радует) Чем занимаешься по будням, если не секрет?' },
    { senderUserId: demo.id, hoursOffset: 5.4, body: 'Работаю дизайнером, вечерами обычно читаю или гуляю с собакой. А ты?' },
    { senderUserId: anna.id, hoursOffset: 20, body: 'Я ветеринар, так что вечера у меня чаще с чужими собаками, чем со своими)' },
    { senderUserId: demo.id, hoursOffset: 20.3, body: 'Звучит как призвание. Никогда не хотела сменить профессию?' },
    { senderUserId: anna.id, hoursOffset: 21, body: 'Пару раз, когда дежурства особенно долгие. Но нет, не всерьёз' },
    { senderUserId: demo.id, hoursOffset: 21.5, body: 'Понимаю, у меня похожая история с дедлайнами' },
    { senderUserId: anna.id, hoursOffset: 44, body: 'Может быть, стоит как-нибудь встретиться и обсудить дедлайны и дежурства вживую?' },
    { senderUserId: demo.id, hoursOffset: 44.3, body: 'С удовольствием! Как насчёт выходных?' },
  ];

  await prisma.message.createMany({
    data: dialogue.map((line) => toMessageRow(conversationId, matchedAt, line)),
  });
}

/**
 * Stage-2 conversation: enough stage-1 history and two completed games to
 * justify the transition, then a handful of stage-2 messages (including one
 * voice message) and a currently-open stage-2 game — so voice limits and the
 * game screen are visible without manually chatting through both stages.
 */
export async function seedStage2Dialog(
  prisma: PrismaClient,
  personas: Map<string, SeedPersona>,
): Promise<void> {
  const demo = mustGet(personas, 'demo');
  const igor = mustGet(personas, 'igor');
  const matchedAt = addDays(new Date(), -4);
  const stage2StartedAt = addHours(matchedAt, 48);

  await ensureMutualLikes(prisma, demo.id, igor.id, matchedAt);
  const match = await ensureActiveMatch(prisma, demo.id, igor.id, matchedAt);
  const conversationId = await ensureConversationShell(prisma, match, matchedAt);

  if (await hasMessages(prisma, conversationId)) {
    return;
  }

  const phaseA: DialogueLine[] = [
    { senderUserId: igor.id, hoursOffset: 0, body: 'Привет! Кофе на фото — сам обжариваешь или готовое покупаешь?' },
    { senderUserId: demo.id, hoursOffset: 0.3, body: 'Привет! Пока покупаю, но давно хочу попробовать обжарку сама' },
    { senderUserId: igor.id, hoursOffset: 1, body: 'Могу подсказать с чего начать, у меня дома целая лаборатория' },
    { senderUserId: demo.id, hoursOffset: 1.3, body: 'Заманчиво. А как давно этим увлекаешься?' },
    { senderUserId: igor.id, hoursOffset: 2, body: 'Года три, началось с того, что не устроил вкус во всех кофейнях района' },
    { senderUserId: demo.id, hoursOffset: 2.3, body: 'Знакомое чувство. У меня так было с хлебом — теперь пеку сама' },
    { senderUserId: igor.id, hoursOffset: 10, body: 'Кстати, как прошла неделя?' },
    { senderUserId: demo.id, hoursOffset: 10.3, body: 'Насыщенно, но хорошо. А у тебя?' },
    { senderUserId: igor.id, hoursOffset: 11, body: 'Катался на велосипеде почти каждый день, стараюсь выбираться хотя бы раз' },
    { senderUserId: demo.id, hoursOffset: 11.3, body: 'Далеко забираешься?' },
    { senderUserId: igor.id, hoursOffset: 12, body: 'По-разному, иногда просто по городу, иногда за город на весь день' },
    { senderUserId: demo.id, hoursOffset: 12.3, body: 'Звучит как отличный способ отключиться от работы' },
  ];

  await prisma.message.createMany({
    data: phaseA.map((line) => toMessageRow(conversationId, matchedAt, line)),
  });

  const game1 = await prisma.chatGame.upsert({
    where: { conversationId_question: { conversationId, question: GAME_QUESTION_1 } },
    update: {},
    create: {
      conversationId,
      stage: 1,
      gameType: 'question',
      question: GAME_QUESTION_1,
      shownAt: addHours(matchedAt, 6),
      completedAt: addHours(matchedAt, 6.6),
    },
  });
  await prisma.gameAnswer.upsert({
    where: { gameId_userId: { gameId: game1.id, userId: demo.id } },
    update: {},
    create: { gameId: game1.id, userId: demo.id, answer: 'Хорошая музыка и утренний кофе', answeredAt: addHours(matchedAt, 6.3) },
  });
  await prisma.gameAnswer.upsert({
    where: { gameId_userId: { gameId: game1.id, userId: igor.id } },
    update: {},
    create: { gameId: game1.id, userId: igor.id, answer: 'Звонок от старого друга', answeredAt: addHours(matchedAt, 6.6) },
  });

  const game2 = await prisma.chatGame.upsert({
    where: { conversationId_question: { conversationId, question: GAME_QUESTION_2 } },
    update: {},
    create: {
      conversationId,
      stage: 1,
      gameType: 'question',
      question: GAME_QUESTION_2,
      shownAt: addHours(matchedAt, 24),
      completedAt: addHours(matchedAt, 24.6),
    },
  });
  await prisma.gameAnswer.upsert({
    where: { gameId_userId: { gameId: game2.id, userId: demo.id } },
    update: {},
    create: { gameId: game2.id, userId: demo.id, answer: 'Пять минут тишины перед началом дня', answeredAt: addHours(matchedAt, 24.3) },
  });
  await prisma.gameAnswer.upsert({
    where: { gameId_userId: { gameId: game2.id, userId: igor.id } },
    update: {},
    create: { gameId: game2.id, userId: igor.id, answer: 'Обжарка кофе по выходным', answeredAt: addHours(matchedAt, 24.6) },
  });

  // Mirrors the system message advanceStageIfReady() inserts on transition.
  await prisma.message.create({
    data: {
      conversationId,
      senderUserId: null,
      body: STAGE_1_TO_2_MESSAGE,
      isSystemMessage: true,
      status: MessageStatus.sent,
      messageWeight: 1,
      createdAt: stage2StartedAt,
    },
  });

  const voiceDurationSec = 30;
  const phaseB: DialogueLine[] = [
    { senderUserId: demo.id, hoursOffset: 0.5, body: 'О, кажется, мы прошли на новый уровень! 🎉' },
    { senderUserId: igor.id, hoursOffset: 1, body: 'Погнали дальше? Теперь ещё и голосовые доступны' },
    { senderUserId: demo.id, hoursOffset: 1.5, body: 'Заценим?' },
    { senderUserId: igor.id, hoursOffset: 2, body: 'Держи первое голосовое, только я тут немного тараторю', voiceDurationSec },
    { senderUserId: demo.id, hoursOffset: 2.5, body: 'Классно! Совсем не тараторишь, кстати' },
    { senderUserId: igor.id, hoursOffset: 3, body: 'Уговорила, распишу подробнее в следующий раз' },
  ];

  await prisma.message.createMany({
    data: phaseB.map((line) => toMessageRow(conversationId, stage2StartedAt, line)),
  });

  await prisma.chatGame.upsert({
    where: { conversationId_question: { conversationId, question: GAME_QUESTION_3 } },
    update: {},
    create: {
      conversationId,
      stage: 2,
      gameType: 'question',
      question: GAME_QUESTION_3,
      shownAt: addHours(stage2StartedAt, 3.5),
      completedAt: null,
    },
  });

  const igorIsUserA = match.userAId === igor.id;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      stage: 2,
      stage2StartedAt,
      stageUpdatedAt: stage2StartedAt,
      user1VoiceTotalSec: igorIsUserA ? voiceDurationSec : 0,
      user2VoiceTotalSec: igorIsUserA ? 0 : voiceDurationSec,
      updatedAt: new Date(),
    },
  });
}

export async function seedChatScenarios(
  prisma: PrismaClient,
  personas: Map<string, SeedPersona>,
): Promise<void> {
  await seedStage1Dialog(prisma, personas);
  await seedStage2Dialog(prisma, personas);
}
