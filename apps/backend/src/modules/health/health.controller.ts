import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService, type HealthResult } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthResult> {
    const health = await this.healthService.getHealth();

    // Task 049: при недоступной зависимости отдаём 503, иначе healthcheck
    // в docker-compose (`fetch(...).then(r => r.ok ...)`) продолжит считать
    // контейнер здоровым. Тело ответа при этом сохраняет обычную форму,
    // поэтому диагностика остаётся читаемой.
    response.status(
      health.status === 'ok'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE,
    );

    return health;
  }
}
