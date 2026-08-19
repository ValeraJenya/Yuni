import type { PrismaClient } from '@prisma/client';

// Closes Task 045: conversation_starters is empty on any clean database, so
// GET /chat/starters always returned []. No unique constraint exists on
// `text`, so idempotency is a plain existence check per phrase.
const STARTER_PHRASES = [
  'Какой момент этой недели ты бы хотел(а) пережить ещё раз?',
  'Что сейчас в твоём плейлисте на повторе?',
  'Куда бы ты поехал(а) прямо сейчас, если бы не было ограничений?',
  'Какая мелочь обычно делает твой день лучше?',
];

export async function seedConversationStarters(prisma: PrismaClient): Promise<void> {
  for (const text of STARTER_PHRASES) {
    const existing = await prisma.conversationStarter.findFirst({
      where: { text },
      select: { id: true },
    });

    if (existing) {
      await prisma.conversationStarter.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      continue;
    }

    await prisma.conversationStarter.create({
      data: { text, isActive: true },
    });
  }
}
