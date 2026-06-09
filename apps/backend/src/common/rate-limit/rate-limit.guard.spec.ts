import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_WINDOW_MS,
} from './rate-limit.constants';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import type { RateLimitPolicy } from './rate-limit.types';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const IP_ADDRESS = '203.0.113.10';

describe('RateLimitGuard', () => {
  it('uses user id for authenticated endpoint policies', () => {
    const { guard, rateLimitService } = createGuard(RATE_LIMIT_POLICIES.likesAction);

    expect(
      guard.canActivate(
        createContext({
          ip: IP_ADDRESS,
          user: { id: USER_ID },
        }),
      ),
    ).toBe(true);
    expect(rateLimitService.consumeMany).toHaveBeenCalledWith([
      {
        key: expect.stringContaining(`user:${USER_ID}`),
        limit: 60,
        windowMs: RATE_LIMIT_WINDOW_MS.hour,
      },
    ]);
  });

  it('uses IP for unauthenticated endpoint policies', () => {
    const { guard, rateLimitService } = createGuard(RATE_LIMIT_POLICIES.authRegister);

    guard.canActivate(
      createContext({
        ip: IP_ADDRESS,
      }),
    );

    expect(rateLimitService.consumeMany).toHaveBeenCalledWith([
      {
        key: expect.stringContaining(`ip:${IP_ADDRESS}`),
        limit: 3,
        windowMs: RATE_LIMIT_WINDOW_MS.hour,
      },
    ]);
  });

  it('uses normalized email hash for login composite policy without raw email', () => {
    const { guard, rateLimitService } = createGuard(RATE_LIMIT_POLICIES.authLogin);
    const rawEmail = ' PERSON@Example.COM ';
    const expectedHash = createHash('sha256')
      .update(rawEmail.trim().toLowerCase())
      .digest('hex');

    guard.canActivate(
      createContext({
        ip: IP_ADDRESS,
        body: {
          email: rawEmail,
        },
      }),
    );

    const inputs = rateLimitService.consumeMany.mock.calls[0][0];
    const serializedInputs = JSON.stringify(inputs);

    expect(inputs).toEqual([
      {
        key: expect.stringContaining(`ip:${IP_ADDRESS}`),
        limit: 20,
        windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      },
      {
        key: expect.stringContaining(expectedHash),
        limit: 5,
        windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      },
    ]);
    expect(serializedInputs).not.toContain(rawEmail);
    expect(serializedInputs).not.toContain('person@example.com');
  });

  it('uses a safe missing IP fallback', () => {
    const { guard, rateLimitService } = createGuard(RATE_LIMIT_POLICIES.authRegister);

    guard.canActivate(createContext({}));

    expect(rateLimitService.consumeMany).toHaveBeenCalledWith([
      {
        key: expect.stringContaining('ip:unknown-ip'),
        limit: 3,
        windowMs: RATE_LIMIT_WINDOW_MS.hour,
      },
    ]);
  });

  it('returns a safe Too Many Requests exception shape', () => {
    const { guard, rateLimitService } = createGuard(RATE_LIMIT_POLICIES.authLogin);
    rateLimitService.consumeMany.mockReturnValue({
      allowed: false,
      retryAfterSeconds: 42,
    });

    expect(() =>
      guard.canActivate(
        createContext({
          ip: IP_ADDRESS,
          body: {
            email: 'person@example.com',
          },
          user: { id: USER_ID },
        }),
      ),
    ).toThrow(HttpException);

    try {
      guard.canActivate(
        createContext({
          ip: IP_ADDRESS,
          body: {
            email: 'person@example.com',
          },
          user: { id: USER_ID },
        }),
      );
    } catch (error) {
      const response = (error as HttpException).getResponse();
      const serializedResponse = JSON.stringify(response);

      expect(response).toEqual({
        statusCode: 429,
        message: 'Too many requests',
        retryAfterSeconds: 42,
      });
      expect(serializedResponse).not.toContain('person@example.com');
      expect(serializedResponse).not.toContain(USER_ID);
      expect(serializedResponse).not.toContain(IP_ADDRESS);
      expect(serializedResponse).not.toContain('auth.login');
      expect(serializedResponse).not.toContain('rate-limit');
    }
  });

  it('makes LIKE and SKIP share the same user bucket', () => {
    const guard = createGuardWithRealService(RATE_LIMIT_POLICIES.likesAction);
    const context = createContext({
      ip: IP_ADDRESS,
      user: { id: USER_ID },
    });

    for (let index = 0; index < 60; index += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });

  it('blocks excessive chat messages on the per-minute user policy', () => {
    const guard = createGuardWithRealService(RATE_LIMIT_POLICIES.chatSend);
    const context = createContext({
      ip: IP_ADDRESS,
      user: { id: USER_ID },
    });

    for (let index = 0; index < 30; index += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });

  it('blocks excessive report creation on the user policy', () => {
    const guard = createGuardWithRealService(RATE_LIMIT_POLICIES.reportCreate);
    const context = createContext({
      ip: IP_ADDRESS,
      user: { id: USER_ID },
    });

    for (let index = 0; index < 10; index += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });
});

function createGuard(policy: RateLimitPolicy) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(policy),
  };
  const rateLimitService = {
    consumeMany: jest.fn().mockReturnValue({ allowed: true }),
  };

  return {
    guard: new RateLimitGuard(
      reflector as never,
      rateLimitService as unknown as RateLimitService,
    ),
    rateLimitService,
  };
}

function createGuardWithRealService(policy: RateLimitPolicy): RateLimitGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(policy),
  };

  return new RateLimitGuard(
    reflector as never,
    new RateLimitService(),
  );
}

function createContext(request: {
  ip?: string;
  ips?: string[];
  body?: Record<string, unknown>;
  user?: { id: string };
  socket?: { remoteAddress?: string };
}): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
