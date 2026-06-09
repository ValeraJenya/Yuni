import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import {
  RATE_LIMIT_POLICIES_METADATA,
} from './rate-limit.constants';
import { RateLimitService } from './rate-limit.service';
import type { RateLimitPolicy, RateLimitRule } from './rate-limit.types';

interface RateLimitedRequest extends Request {
  user?: {
    id?: string;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<RateLimitPolicy>(
      RATE_LIMIT_POLICIES_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!policy || policy.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RateLimitedRequest>();
    const inputs = policy.map((rule) => ({
      key: this.buildBucketKey(rule, request),
      limit: rule.limit,
      windowMs: rule.windowMs,
    }));
    const result = this.rateLimitService.consumeMany(inputs);

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retryAfterSeconds: result.retryAfterSeconds ?? 1,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private buildBucketKey(rule: RateLimitRule, request: RateLimitedRequest): string {
    return `rate-limit:${rule.name}:${this.getSubjectKey(rule, request)}`;
  }

  private getSubjectKey(
    rule: RateLimitRule,
    request: RateLimitedRequest,
  ): string {
    const ip = this.getIpKey(request);

    if (rule.key === 'ip') {
      return `ip:${ip}`;
    }

    if (rule.key === 'user') {
      return request.user?.id ? `user:${request.user.id}` : `ip-fallback:${ip}`;
    }

    return `ip-email-hash:${ip}:${this.getEmailHash(request)}`;
  }

  private getIpKey(request: RateLimitedRequest): string {
    return (
      request.ip ||
      request.ips?.[0] ||
      request.socket?.remoteAddress ||
      'unknown-ip'
    );
  }

  private getEmailHash(request: RateLimitedRequest): string {
    const email = request.body?.email;

    if (typeof email !== 'string') {
      return 'missing-email';
    }

    return createHash('sha256')
      .update(email.trim().toLowerCase())
      .digest('hex');
  }
}
