import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

jest.mock('argon2', () => ({
  hash: jest.fn(async (value: string) => `hash:${value}`),
  verify: jest.fn(async (hash: string, value: string) => hash === `hash:${value}`),
}));

const FIXED_NOW = new Date('2026-06-06T12:00:00.000Z');
const REFRESH_TTL_DAYS = 30;
const TEST_META = {
  ipAddress: '203.0.113.10',
  userAgent: 'Jest auth spec',
};

interface ProfileFixture {
  handle: string;
  displayName: string;
}

interface UserFixture {
  id: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  createdAt: Date;
  deletedAt: Date | null;
  profile: ProfileFixture | null;
}

interface RefreshTokenFixture {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  lastUsedAt: Date | null;
  user: UserFixture;
}

interface UserCreateArgs {
  data: {
    email: string;
    passwordHash: string;
    profile: {
      create: {
        handle: string;
        displayName: string;
        birthDate: Date;
      };
    };
  };
}

interface RefreshTokenCreateArgs {
  data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

interface RefreshTokenFindUniqueArgs {
  where: {
    id: string;
  };
}

interface RefreshTokenUpdateManyArgs {
  where: {
    id: string;
    revokedAt: null;
    expiresAt?: {
      gt: Date;
    };
  };
  data: {
    revokedAt: Date;
    revokedReason: string;
    lastUsedAt: Date;
  };
}

interface PrismaMock {
  user: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  profile: {
    findFirst: jest.Mock;
  };
  refreshToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
}

interface ServiceContext {
  service: AuthService;
  prisma: PrismaMock;
  jwtService: {
    signAsync: jest.Mock;
  };
  configService: {
    getOrThrow: jest.Mock;
  };
}

describe('AuthService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('register', () => {
    it('registers an adult user and returns a safe auth response', async () => {
      const { service, prisma, jwtService } = createService();
      const dto: RegisterDto = {
        email: ' PERSON@Example.COM ',
        password: 'correct-password',
        handle: ' Person_01 ',
        displayName: ' Person One ',
        birthDate: '2008-06-06',
      };

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.profile.findFirst.mockResolvedValue(null);
      prisma.user.create.mockImplementation(async (args: UserCreateArgs) =>
        makeUser({
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          profile: {
            handle: args.data.profile.create.handle,
            displayName: args.data.profile.create.displayName,
          },
        }),
      );
      prisma.refreshToken.create.mockResolvedValue({ id: 'refresh-token-1' });

      const result = await service.register(dto, TEST_META);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'person@example.com',
            passwordHash: 'hash:correct-password',
            profile: {
              create: {
                handle: 'Person_01',
                displayName: 'Person One',
                birthDate: new Date('2008-06-06T00:00:00.000Z'),
              },
            },
          }),
        }),
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'person@example.com' },
        { secret: 'test-access-secret', expiresIn: 900 },
      );
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tokenHash: expect.stringMatching(/^hash:/),
          expiresAt: expectedRefreshExpiry(),
          ipAddress: TEST_META.ipAddress,
          userAgent: TEST_META.userAgent,
        },
        select: { id: true },
      });
      expect(result).toMatchObject({
        user: {
          id: 'user-1',
          email: 'person@example.com',
          status: UserStatus.active,
          profile: {
            handle: 'Person_01',
            displayName: 'Person One',
          },
        },
        accessToken: 'access:user-1:person@example.com',
        refreshExpiresAt: expectedRefreshExpiry(),
      });
      expect(result.refreshCookieValue).toMatch(/^refresh-token-1\./);
      expectNoCredentialKeys(result);
    });

    it('rejects registration when the user is younger than 18', async () => {
      const { service, prisma } = createService();

      await expect(
        service.register(
          makeRegisterDto({ birthDate: '2008-06-07' }),
          TEST_META,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.user.findFirst).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('rejects registration when birthDate is not YYYY-MM-DD', async () => {
      const { service, prisma } = createService();

      await expect(
        service.register(
          makeRegisterDto({ birthDate: '06-06-2008' }),
          TEST_META,
        ),
      ).rejects.toThrow('birthDate must be in YYYY-MM-DD format');

      expect(prisma.user.findFirst).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('rejects registration when birthDate is in the future', async () => {
      const { service, prisma } = createService();

      await expect(
        service.register(
          makeRegisterDto({ birthDate: '2027-01-01' }),
          TEST_META,
        ),
      ).rejects.toThrow('birthDate cannot be in the future');

      expect(prisma.user.findFirst).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('logs in with valid credentials and returns a safe auth response', async () => {
      const { service, prisma } = createService();
      const user = makeUser({
        email: 'person@example.com',
        passwordHash: 'hash:correct-password',
      });
      const dto: LoginDto = {
        email: ' PERSON@example.com ',
        password: 'correct-password',
      };

      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.refreshToken.create.mockResolvedValue({ id: 'refresh-token-login' });

      const result = await service.login(dto, TEST_META);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'person@example.com',
            mode: 'insensitive',
          },
          deletedAt: null,
        },
        include: {
          profile: true,
        },
      });
      expect(argon2.verify).toHaveBeenCalledWith(
        'hash:correct-password',
        'correct-password',
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLoginAt: FIXED_NOW },
      });
      expect(result.accessToken).toBe('access:user-1:person@example.com');
      expect(result.refreshCookieValue).toMatch(/^refresh-token-login\./);
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'person@example.com',
        status: UserStatus.active,
        createdAt: user.createdAt,
        profile: {
          handle: 'person_01',
          displayName: 'Person One',
        },
      });
      expectNoCredentialKeys(result);
    });

    it('rejects an invalid password without issuing tokens', async () => {
      const { service, prisma } = createService();
      prisma.user.findFirst.mockResolvedValue(
        makeUser({ passwordHash: 'hash:correct-password' }),
      );

      await expect(
        service.login(
          { email: 'person@example.com', password: 'wrong-password' },
          TEST_META,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates an active refresh token once and rejects reuse of the old token', async () => {
      const { service, prisma } = createService();
      const user = makeUser();
      const refreshToken = makeRefreshToken({
        id: 'refresh-token-old',
        tokenHash: 'hash:old-raw-token',
        user,
      });
      const transactionUpdateMany = jest.fn(
        async (args: RefreshTokenUpdateManyArgs) => {
          if (
            args.where.id !== refreshToken.id ||
            refreshToken.revokedAt ||
            refreshToken.expiresAt <= (args.where.expiresAt?.gt ?? FIXED_NOW)
          ) {
            return { count: 0 };
          }

          refreshToken.revokedAt = args.data.revokedAt;
          refreshToken.revokedReason = args.data.revokedReason;
          refreshToken.lastUsedAt = args.data.lastUsedAt;
          return { count: 1 };
        },
      );
      const transactionCreate = jest.fn(async (_args: RefreshTokenCreateArgs) => ({
        id: 'refresh-token-new',
      }));

      prisma.refreshToken.findUnique.mockImplementation(
        async (args: RefreshTokenFindUniqueArgs) =>
          args.where.id === refreshToken.id ? refreshToken : null,
      );
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.$transaction.mockImplementation(
        async (
          callback: (tx: {
            refreshToken: {
              updateMany: typeof transactionUpdateMany;
              create: typeof transactionCreate;
            };
          }) => Promise<unknown>,
        ) =>
          callback({
            refreshToken: {
              updateMany: transactionUpdateMany,
              create: transactionCreate,
            },
          }),
      );

      const result = await service.refresh('refresh-token-old.old-raw-token', TEST_META);

      expect(transactionUpdateMany).toHaveBeenCalledWith({
        where: {
          id: 'refresh-token-old',
          revokedAt: null,
          expiresAt: { gt: FIXED_NOW },
        },
        data: {
          revokedAt: FIXED_NOW,
          revokedReason: 'rotated',
          lastUsedAt: FIXED_NOW,
        },
      });
      expect(transactionCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tokenHash: expect.stringMatching(/^hash:/),
          expiresAt: expectedRefreshExpiry(),
          ipAddress: TEST_META.ipAddress,
          userAgent: TEST_META.userAgent,
        },
        select: { id: true },
      });
      expect(refreshToken.revokedReason).toBe('rotated');
      expect(result.refreshCookieValue).toMatch(/^refresh-token-new\./);
      expect(result.accessToken).toBe('access:user-1:person@example.com');

      await expect(
        service.refresh('refresh-token-old.old-raw-token', TEST_META),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('rejects a revoked refresh token', async () => {
      const { service, prisma } = createService();
      prisma.refreshToken.findUnique.mockResolvedValue(
        makeRefreshToken({
          tokenHash: 'hash:raw-token',
          revokedAt: new Date('2026-06-06T11:00:00.000Z'),
        }),
      );

      await expect(
        service.refresh('refresh-token-1.raw-token', TEST_META),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects an expired refresh token', async () => {
      const { service, prisma } = createService();
      prisma.refreshToken.findUnique.mockResolvedValue(
        makeRefreshToken({
          tokenHash: 'hash:raw-token',
          expiresAt: new Date('2026-06-06T11:59:59.000Z'),
        }),
      );

      await expect(
        service.refresh('refresh-token-1.raw-token', TEST_META),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes a refresh token, makes it unusable, and hides repeated logout details', async () => {
      const { service, prisma } = createService();
      const refreshToken = makeRefreshToken({
        id: 'refresh-token-logout',
        tokenHash: 'hash:logout-raw-token',
      });

      prisma.refreshToken.findUnique.mockImplementation(
        async (args: RefreshTokenFindUniqueArgs) =>
          args.where.id === refreshToken.id ? refreshToken : null,
      );
      prisma.refreshToken.updateMany.mockImplementation(
        async (args: RefreshTokenUpdateManyArgs) => {
          if (args.where.id !== refreshToken.id || refreshToken.revokedAt) {
            return { count: 0 };
          }

          refreshToken.revokedAt = args.data.revokedAt;
          refreshToken.revokedReason = args.data.revokedReason;
          refreshToken.lastUsedAt = args.data.lastUsedAt;
          return { count: 1 };
        },
      );

      await expect(
        service.logout('refresh-token-logout.logout-raw-token'),
      ).resolves.toEqual({ success: true });
      expect(refreshToken.revokedReason).toBe('logout');

      await expect(
        service.refresh('refresh-token-logout.logout-raw-token', TEST_META),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      await expect(
        service.logout('refresh-token-logout.logout-raw-token'),
      ).resolves.toEqual({ success: true });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});

function createService(): ServiceContext {
  const prisma = createPrismaMock();
  const jwtService = {
    signAsync: jest.fn(async (payload: { sub: string; email: string }) =>
      `access:${payload.sub}:${payload.email}`,
    ),
  };
  const configValues = new Map<string, unknown>([
    ['auth.jwtAccessSecret', 'test-access-secret'],
    ['auth.jwtAccessTtlSeconds', 900],
    ['auth.refreshTokenTtlDays', REFRESH_TTL_DAYS],
  ]);
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      if (!configValues.has(key)) {
        throw new Error(`Missing test config value for ${key}`);
      }

      return configValues.get(key);
    }),
  };

  return {
    service: new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    ),
    prisma,
    jwtService,
    configService,
  };
}

function createPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      findFirst: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(
    async (callback: (tx: PrismaMock) => Promise<unknown>) => callback(prisma),
  );

  return prisma;
}

function makeRegisterDto(overrides: Partial<RegisterDto> = {}): RegisterDto {
  return {
    email: 'person@example.com',
    password: 'correct-password',
    handle: 'person_01',
    displayName: 'Person One',
    birthDate: '2008-06-06',
    ...overrides,
  };
}

function makeUser(overrides: Partial<UserFixture> = {}): UserFixture {
  return {
    id: 'user-1',
    email: 'person@example.com',
    passwordHash: 'hash:correct-password',
    status: UserStatus.active,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    profile: {
      handle: 'person_01',
      displayName: 'Person One',
    },
    ...overrides,
  };
}

function makeRefreshToken(
  overrides: Partial<RefreshTokenFixture> = {},
): RefreshTokenFixture {
  const user = overrides.user ?? makeUser();

  return {
    id: 'refresh-token-1',
    userId: user.id,
    tokenHash: 'hash:raw-token',
    expiresAt: expectedRefreshExpiry(),
    revokedAt: null,
    revokedReason: null,
    lastUsedAt: null,
    user,
    ...overrides,
  };
}

function expectedRefreshExpiry(): Date {
  return new Date(FIXED_NOW.getTime() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function expectNoCredentialKeys(value: unknown): void {
  const keys = collectObjectKeys(value).map((key) => key.toLowerCase());

  expect(keys).not.toContain('password');
  expect(keys).not.toContain('passwordhash');
  expect(keys).not.toContain('hash');
}

function collectObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object' || value instanceof Date) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectObjectKeys(item));
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => [
    key,
    ...collectObjectKeys(nestedValue),
  ]);
}
