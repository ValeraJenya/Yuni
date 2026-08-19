import { PrismaClient } from '@prisma/client';
import { assertSafeToSeed } from './seed/guard';
import { seedChatScenarios } from './seed/chat';
import { seedConversationStarters } from './seed/starters';
import { seedUsers } from './seed/users';

async function main(): Promise<void> {
  assertSafeToSeed(process.env.DATABASE_URL, process.env.NODE_ENV);

  const prisma = new PrismaClient();

  try {
    const personas = await seedUsers(prisma);
    await seedChatScenarios(prisma, personas);
    await seedConversationStarters(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
