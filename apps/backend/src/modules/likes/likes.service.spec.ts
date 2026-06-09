import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LikeKind,
  Prisma,
  ProfileVisibilityMode,
  UserStatus,
} from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { MatchesService } from '../matches/matches.service';
import type { ModerationService } from '../moderation/moderation.service';
import { LikesService } from './likes.service';

const CURRENT_USER: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'person@example.com',
};
const TARGET_PROFILE_USER_ID = '22222222-2222-4222-8222-222222222222';
const FIXED_NOW = new Date('2026-06-07T12:00:00.000Z');

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
  };
  profile: {
    findUnique: jest.Mock;
  };
  like: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
}

interface MatchesServiceMock {
  tryCreateMatchFromLike: jest.Mock;
}

interface ModerationServiceMock {
  assertNoBlockBetween: jest.Mock;
}

interface LikeCreateArgs {
  data: {
    likedUserId: string;
    kind: LikeKind;
    expiresAt: Date;
  };
}

interface TargetProfileFixture {
  userId: string;
  isDiscoverable: boolean;
  user: {
    status: UserStatus;
    deletedAt: Date | null;
    privacySettings: {
      profileVisibilityMode: ProfileVisibilityMode;
    } | null;
  };
}

describe('LikesService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a LIKE interaction that expires in 3 days', async () => {
    const { service, prisma, matchesService } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValue(makeTargetProfile());
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.create.mockImplementation(async (args: LikeCreateArgs) => ({
      likedUserId: args.data.likedUserId,
      kind: args.data.kind,
      expiresAt: args.data.expiresAt,
    }));

    const result = await service.likeProfile(CURRENT_USER, TARGET_PROFILE_USER_ID);

    expect(prisma.like.findFirst).toHaveBeenCalledWith({
      where: {
        likerUserId: CURRENT_USER.id,
        likedUserId: TARGET_PROFILE_USER_ID,
        expiresAt: {
          gt: FIXED_NOW,
        },
      },
      select: { id: true },
    });
    expect(prisma.like.create).toHaveBeenCalledWith({
      data: {
        likerUserId: CURRENT_USER.id,
        likedUserId: TARGET_PROFILE_USER_ID,
        kind: LikeKind.like,
        createdAt: FIXED_NOW,
        expiresAt: addDays(FIXED_NOW, 3),
      },
      select: {
        likedUserId: true,
        kind: true,
        expiresAt: true,
      },
    });
    expect(result).toEqual({
      interaction: {
        targetProfileUserId: TARGET_PROFILE_USER_ID,
        action: 'like',
        expiresAt: addDays(FIXED_NOW, 3),
      },
    });
    expect(matchesService.tryCreateMatchFromLike).toHaveBeenCalledWith({
      actorUserId: CURRENT_USER.id,
      targetUserId: TARGET_PROFILE_USER_ID,
      now: FIXED_NOW,
    });
    expectNoRawLikeOrPrivateKeys(result);
  });

  it('creates a SKIP/PASS interaction that expires in 1 day', async () => {
    const { service, prisma, matchesService } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValue(makeTargetProfile());
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.create.mockImplementation(async (args: LikeCreateArgs) => ({
      likedUserId: args.data.likedUserId,
      kind: args.data.kind,
      expiresAt: args.data.expiresAt,
    }));

    const result = await service.skipProfile(CURRENT_USER, TARGET_PROFILE_USER_ID);

    expect(prisma.like.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: LikeKind.pass,
          expiresAt: addDays(FIXED_NOW, 1),
        }),
      }),
    );
    expect(result).toEqual({
      interaction: {
        targetProfileUserId: TARGET_PROFILE_USER_ID,
        action: 'skip',
        expiresAt: addDays(FIXED_NOW, 1),
      },
    });
    expect(matchesService.tryCreateMatchFromLike).not.toHaveBeenCalled();
  });

  it('includes a match only when a backend mutual LIKE created one', async () => {
    const { service, prisma, matchesService } = createService();
    const match = {
      id: '33333333-3333-4333-8333-333333333333',
      matchedProfile: {
        userId: TARGET_PROFILE_USER_ID,
        handle: 'target_user',
        displayName: 'Target',
        primaryPhotoUrl: null,
      },
      matchedAt: FIXED_NOW,
      expiresAt: addDays(FIXED_NOW, 7),
      status: 'active',
      conversationId: null,
      conversationStarted: false,
    };
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValue(makeTargetProfile());
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.create.mockImplementation(async (args: LikeCreateArgs) => ({
      likedUserId: args.data.likedUserId,
      kind: args.data.kind,
      expiresAt: args.data.expiresAt,
    }));
    matchesService.tryCreateMatchFromLike.mockResolvedValue(match);

    await expect(
      service.likeProfile(CURRENT_USER, TARGET_PROFILE_USER_ID),
    ).resolves.toEqual({
      interaction: {
        targetProfileUserId: TARGET_PROFILE_USER_ID,
        action: 'like',
        expiresAt: addDays(FIXED_NOW, 3),
      },
      match,
    });
  });

  it('rejects self-like and self-skip before querying the database', async () => {
    const { service, prisma } = createService();

    await expect(
      service.likeProfile(CURRENT_USER, CURRENT_USER.id),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.skipProfile(CURRENT_USER, CURRENT_USER.id),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.like.create).not.toHaveBeenCalled();
  });

  it('rejects missing, inactive, and deleted target profiles safely', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());

    for (const targetProfile of [
      null,
      makeTargetProfile({ user: { status: UserStatus.disabled, deletedAt: null } }),
      makeTargetProfile({
        user: {
          status: UserStatus.active,
          deletedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      }),
    ]) {
      prisma.profile.findUnique.mockResolvedValueOnce(targetProfile);

      await expect(
        service.likeProfile(CURRENT_USER, TARGET_PROFILE_USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    }

    expect(prisma.like.create).not.toHaveBeenCalled();
  });

  it('rejects private and non-discoverable target profiles', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());

    for (const targetProfile of [
      makeTargetProfile({
        user: {
          status: UserStatus.active,
          deletedAt: null,
          privacySettings: {
            profileVisibilityMode: ProfileVisibilityMode.private,
          },
        },
      }),
      makeTargetProfile({ isDiscoverable: false }),
    ]) {
      prisma.profile.findUnique.mockResolvedValueOnce(targetProfile);

      await expect(
        service.skipProfile(CURRENT_USER, TARGET_PROFILE_USER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }

    expect(prisma.like.create).not.toHaveBeenCalled();
  });

  it('rejects inactive current users', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.disabled,
      deletedAt: null,
    });

    await expect(
      service.likeProfile(CURRENT_USER, TARGET_PROFILE_USER_ID),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
    expect(prisma.like.create).not.toHaveBeenCalled();
  });

  it('returns a safe conflict when an active interaction already exists', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValue(makeTargetProfile());
    prisma.like.findFirst.mockResolvedValue({ id: 'existing-like-id' });

    await expect(
      service.skipProfile(CURRENT_USER, TARGET_PROFILE_USER_ID),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.like.create).not.toHaveBeenCalled();
  });

  it('rejects LIKE and SKIP when a block exists in either direction', async () => {
    const { service, prisma, moderationService, matchesService } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValue(makeTargetProfile());
    moderationService.assertNoBlockBetween.mockRejectedValue(
      new ForbiddenException('Forbidden'),
    );

    await expect(
      service.likeProfile(CURRENT_USER, TARGET_PROFILE_USER_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.skipProfile(CURRENT_USER, TARGET_PROFILE_USER_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(moderationService.assertNoBlockBetween).toHaveBeenCalledWith(
      CURRENT_USER.id,
      TARGET_PROFILE_USER_ID,
    );
    expect(prisma.like.findFirst).not.toHaveBeenCalled();
    expect(prisma.like.create).not.toHaveBeenCalled();
    expect(matchesService.tryCreateMatchFromLike).not.toHaveBeenCalled();
  });

  it('allows a new interaction when older interactions are expired', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValue(makeTargetProfile());
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.create.mockImplementation(async (args: LikeCreateArgs) => ({
      likedUserId: args.data.likedUserId,
      kind: args.data.kind,
      expiresAt: args.data.expiresAt,
    }));

    await expect(
      service.likeProfile(CURRENT_USER, TARGET_PROFILE_USER_ID),
    ).resolves.toMatchObject({
      interaction: {
        action: 'like',
      },
    });

    expect(prisma.like.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: {
            gt: FIXED_NOW,
          },
        }),
      }),
    );
    expect(prisma.like.create).toHaveBeenCalledTimes(1);
  });

  it('maps DB active-overlap constraint conflicts to a safe 409', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValue(makeTargetProfile());
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Constraint failed: likes_no_overlapping_active_interactions',
        {
          code: 'P2004',
          clientVersion: 'test',
          meta: {
            database_error: 'likes_no_overlapping_active_interactions',
          },
        },
      ),
    );

    await expect(
      service.likeProfile(CURRENT_USER, TARGET_PROFILE_USER_ID),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

function createService() {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
    like: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  const matchesService: MatchesServiceMock = {
    tryCreateMatchFromLike: jest.fn().mockResolvedValue(null),
  };
  const moderationService: ModerationServiceMock = {
    assertNoBlockBetween: jest.fn().mockResolvedValue(undefined),
  };

  return {
    service: new LikesService(
      prisma as unknown as PrismaService,
      matchesService as unknown as MatchesService,
      moderationService as unknown as ModerationService,
    ),
    prisma,
    matchesService,
    moderationService,
  };
}

function activeUser() {
  return {
    status: UserStatus.active,
    deletedAt: null,
  };
}

function makeTargetProfile(
  overrides: Partial<Omit<TargetProfileFixture, 'user'>> & {
    user?: Partial<TargetProfileFixture['user']>;
  } = {},
): TargetProfileFixture {
  const base: TargetProfileFixture = {
    userId: TARGET_PROFILE_USER_ID,
    isDiscoverable: true,
    user: {
      status: UserStatus.active,
      deletedAt: null,
      privacySettings: {
        profileVisibilityMode: ProfileVisibilityMode.open,
      },
    },
  };

  return {
    ...base,
    ...overrides,
    user: {
      ...base.user,
      ...overrides.user,
    },
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function expectNoRawLikeOrPrivateKeys(value: unknown): void {
  const keys = collectObjectKeys(value);
  const forbiddenKeys = [
    'id',
    'likerUserId',
    'likedUserId',
    'kind',
    'createdAt',
    'updatedAt',
    'email',
    'birthDate',
    'passwordHash',
    'storageKey',
  ];

  for (const key of forbiddenKeys) {
    expect(keys).not.toContain(key);
  }
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
