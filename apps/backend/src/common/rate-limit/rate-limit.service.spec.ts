import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  const input = {
    key: 'rate-limit:test:user-1',
    limit: 2,
    windowMs: 1_000,
  };

  it('allows requests under the configured limit', () => {
    const service = new RateLimitService();

    expect(service.consume(input, 1_000)).toEqual({ allowed: true });
    expect(service.consume(input, 1_100)).toEqual({ allowed: true });
  });

  it('blocks requests over the configured limit with safe retryAfterSeconds', () => {
    const service = new RateLimitService();

    service.consume(input, 1_000);
    service.consume(input, 1_100);

    expect(service.consume(input, 1_200)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
  });

  it('resets the window after expiration', () => {
    const service = new RateLimitService();

    service.consume(input, 1_000);
    service.consume(input, 1_100);

    expect(service.consume(input, 2_001)).toEqual({ allowed: true });
  });

  it('keeps independent buckets by key', () => {
    const service = new RateLimitService();

    service.consume(input, 1_000);
    service.consume(input, 1_100);

    expect(
      service.consume({ ...input, key: 'rate-limit:test:user-2' }, 1_200),
    ).toEqual({ allowed: true });
  });

  it('prunes expired buckets while consuming a new request', () => {
    const service = new RateLimitService();

    service.consume(input, 1_000);
    service.consume({ ...input, key: 'rate-limit:test:user-2' }, 1_100);
    expect(service.getBucketCount()).toBe(2);

    service.consume({ ...input, key: 'rate-limit:test:user-3' }, 2_101);

    expect(service.getBucketCount()).toBe(1);
  });

  it('consumes multi-rule policies atomically when a rule is already blocked', () => {
    const service = new RateLimitService();
    const minuteRule = {
      key: 'rate-limit:test:user-1:minute',
      limit: 1,
      windowMs: 60_000,
    };
    const tenMinuteRule = {
      key: 'rate-limit:test:user-1:ten',
      limit: 2,
      windowMs: 10 * 60_000,
    };

    expect(service.consumeMany([minuteRule, tenMinuteRule], 1_000)).toEqual({
      allowed: true,
    });
    expect(service.consumeMany([minuteRule, tenMinuteRule], 2_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 59,
    });
    expect(service.consume(tenMinuteRule, 3_000)).toEqual({
      allowed: true,
    });
  });
});
