export type RateLimitKeyStrategy = 'ip' | 'user' | 'ip-email-hash';

export interface RateLimitRule {
  name: string;
  limit: number;
  windowMs: number;
  key: RateLimitKeyStrategy;
}

export type RateLimitPolicy = readonly RateLimitRule[];

export interface RateLimitConsumeInput {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitConsumeResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}
