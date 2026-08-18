import type { PrismaService } from '../../common/prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports ok and marks the database up when the query succeeds', async () => {
    const prisma = createPrismaMock();
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await new HealthService(
      prisma as unknown as PrismaService,
    ).getHealth();

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('ok');
    expect(result.service).toBe('yuni-backend');
    expect(result.dependencies).toEqual({ database: 'up' });
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('reports degraded when the database is unreachable (Task 049)', async () => {
    const prisma = createPrismaMock();
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const result = await new HealthService(
      prisma as unknown as PrismaService,
    ).getHealth();

    // Раньше метод возвращал захардкоженный ok и ни к чему не обращался,
    // поэтому Docker считал контейнер здоровым после потери базы.
    expect(result.status).toBe('degraded');
    expect(result.dependencies).toEqual({ database: 'down' });
  });

  it('does not leak the database failure reason', async () => {
    const prisma = createPrismaMock();
    prisma.$queryRaw.mockRejectedValue(
      new Error('connect ECONNREFUSED 10.0.0.5:5432'),
    );

    const result = await new HealthService(
      prisma as unknown as PrismaService,
    ).getHealth();

    // Эндпоинт открыт без аутентификации — адреса и причины наружу не отдаём.
    expect(JSON.stringify(result)).not.toContain('ECONNREFUSED');
    expect(JSON.stringify(result)).not.toContain('10.0.0.5');
  });
});

function createPrismaMock(): { $queryRaw: jest.Mock } {
  return {
    $queryRaw: jest.fn(),
  };
}
