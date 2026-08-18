import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type DependencyStatus = 'up' | 'down';

export interface HealthResult {
  status: 'ok' | 'degraded';
  service: 'yuni-backend';
  timestamp: string;
  dependencies: {
    database: DependencyStatus;
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Task 049: healthcheck обязан обращаться к зависимостям.
   *
   * Раньше метод возвращал захардкоженный `status: 'ok'` и ни к чему не
   * обращался, поэтому Docker считал backend здоровым даже после полной
   * потери базы: healthcheck в docker-compose проверяет только `r.ok`.
   */
  async getHealth(): Promise<HealthResult> {
    const database = await this.checkDatabase();

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      service: 'yuni-backend',
      timestamp: new Date().toISOString(),
      dependencies: {
        database,
      },
    };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return 'up';
    } catch {
      // Причина недоступности наружу не отдаётся: healthcheck открыт без
      // аутентификации, и детали подключения к БД в нём светить незачем.
      return 'down';
    }
  }
}
