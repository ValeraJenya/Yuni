import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RATE_LIMIT_POLICIES_METADATA } from './rate-limit.constants';
import { RateLimitGuard } from './rate-limit.guard';
import type { RateLimitPolicy } from './rate-limit.types';

export function UseRateLimit(policy: RateLimitPolicy) {
  return applyDecorators(
    SetMetadata(RATE_LIMIT_POLICIES_METADATA, policy),
    UseGuards(RateLimitGuard),
  );
}
