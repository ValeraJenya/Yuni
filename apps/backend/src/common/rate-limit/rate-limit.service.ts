import { Injectable } from '@nestjs/common';
import {
  RateLimitConsumeInput,
  RateLimitConsumeResult,
} from './rate-limit.types';

interface RateLimitBucket {
  count: number;
  expiresAtMs: number;
}

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>();

  consume(
    input: RateLimitConsumeInput,
    nowMs = Date.now(),
  ): RateLimitConsumeResult {
    return this.consumeMany([input], nowMs);
  }

  consumeMany(
    inputs: RateLimitConsumeInput[],
    nowMs = Date.now(),
  ): RateLimitConsumeResult {
    this.pruneExpired(nowMs);

    const prepared = inputs.map((input) => ({
      input,
      bucket: this.getActiveBucket(input, nowMs),
    }));
    const blockedRetryAfterSeconds = prepared
      .filter(({ input, bucket }) => bucket.count >= input.limit)
      .map(({ bucket }) =>
        Math.max(1, Math.ceil((bucket.expiresAtMs - nowMs) / 1000)),
      );

    if (blockedRetryAfterSeconds.length > 0) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(...blockedRetryAfterSeconds),
      };
    }

    for (const { bucket } of prepared) {
      bucket.count += 1;
    }

    return {
      allowed: true,
    };
  }

  reset(): void {
    this.buckets.clear();
  }

  getBucketCount(): number {
    return this.buckets.size;
  }

  private getActiveBucket(
    input: RateLimitConsumeInput,
    nowMs: number,
  ): RateLimitBucket {
    const existing = this.buckets.get(input.key);

    if (existing && existing.expiresAtMs > nowMs) {
      return existing;
    }

    const bucket: RateLimitBucket = {
      count: 0,
      expiresAtMs: nowMs + input.windowMs,
    };
    this.buckets.set(input.key, bucket);
    return bucket;
  }

  private pruneExpired(nowMs: number): void {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.expiresAtMs <= nowMs) {
        this.buckets.delete(key);
      }
    }
  }
}
