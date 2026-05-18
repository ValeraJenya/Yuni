import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: 'yuni-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
