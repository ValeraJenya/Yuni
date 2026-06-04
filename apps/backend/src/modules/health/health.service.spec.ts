import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns backend health metadata', () => {
    const result = new HealthService().getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('yuni-backend');
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});
