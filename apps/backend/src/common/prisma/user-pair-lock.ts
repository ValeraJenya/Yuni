import type { Prisma } from '@prisma/client';
import type { PrismaService } from './prisma.service';

export type PairLockClient = Prisma.TransactionClient | PrismaService;

/**
 * Приводит пару пользователей к каноническому порядку, чтобы обе стороны
 * взаимодействия (кто кого лайкнул, кто кого заблокировал) считали один и тот
 * же ключ.
 */
export function normalizeUserPairKey(
  leftUserId: string,
  rightUserId: string,
): string {
  return leftUserId < rightUserId
    ? `${leftUserId}:${rightUserId}`
    : `${rightUserId}:${leftUserId}`;
}

/**
 * Task 042 — сериализация операций над парой пользователей.
 *
 * Блокировка и создание match трогают разные таблицы, поэтому при READ
 * COMMITTED они друг друга не видят: транзакция, создающая match, не
 * замечает ещё не закоммиченный `Block`, а `endActiveMatchesBetween` в
 * транзакции блокировки не находит ещё не закоммиченный `Match`. В итоге
 * между заблокированными пользователями остаётся активный match.
 *
 * Пере-проверка блока внутри транзакции эту дыру не закрывает — она читает
 * тот же снимок. Нужен общий объект синхронизации, поэтому обе стороны берут
 * advisory-лок по канонической паре: лок держится до конца транзакции и
 * снимается автоматически, в том числе при откате.
 *
 * Порядок в паре канонический и лок ровно один, поэтому взаимных блокировок
 * этот механизм создать не может.
 */
export async function lockUserPair(
  client: PairLockClient,
  leftUserId: string,
  rightUserId: string,
): Promise<void> {
  if (leftUserId === rightUserId) {
    return;
  }

  const key = normalizeUserPairKey(leftUserId, rightUserId);

  await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}
