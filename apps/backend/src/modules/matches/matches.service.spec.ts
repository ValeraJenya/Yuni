import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LikeKind,
  MatchStatus,
  PhotoModerationStatus,
  Prisma,
  ProfileVisibilityMode,
  UserStatus,
} from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { MatchesService } from './matches.service';

const ACTOR_USER_ID = '22222222-2222-4222-8222-222222222222';
const TARGET_USER_ID = '11111111-1111-4111-8111-111111111111';
const THIRD_USER_ID = '33333333-3333-4333-8333-333333333333';
const FOURTH_USER_ID = '44444444-4444-4444-8444-444444444444';
const FIXED_NOW = new Date('2026-06-07T12:00:00.000Z');
const MATCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const CURRENT_USER: AuthenticatedUser = {
  id: ACTOR_USER_ID,
  email: 'person@example.com',
};

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
  };
  like: {
    findFirst: jest.Mock;
  };
  match: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
  };
}

interface MatchCreateArgs {
  data: {
    userAId: string;
    userBId: string;
    status: MatchStatus;
    matchedAt: Date;
    expiresAt: Date;
  };
}

describe('MatchesService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a match when the new LIKE has a reciprocal active LIKE', async () => {
    const { service, prisma } = createService();
    prisma.like.findFirst.mockResolvedValue({ id: 'reciprocal-like-id' });
    prisma.match.findFirst.mockResolvedValue(null);
    prisma.match.create.mockImplementation(async (args: MatchCreateArgs) =>
      makeMatchRecord({
        ...args.data,
        id: MATCH_ID,
      }),
    );

    const result = await service.tryCreateMatchFromLike({
      actorUserId: ACTOR_USER_ID,
      targetUserId: TARGET_USER_ID,
      now: FIXED_NOW,
    });

    expect(prisma.like.findFirst).toHaveBeenCalledWith({
      where: {
        likerUserId: TARGET_USER_ID,
        likedUserId: ACTOR_USER_ID,
        kind: LikeKind.like,
        expiresAt: {
          gt: FIXED_NOW,
        },
      },
      select: { id: true },
    });
    expect(prisma.match.findFirst).toHaveBeenCalledWith({
      where: {
        userAId: TARGET_USER_ID,
        userBId: ACTOR_USER_ID,
        status: MatchStatus.active,
        expiresAt: {
          gt: FIXED_NOW,
        },
      },
      select: expect.any(Object),
    });
    expect(prisma.match.create).toHaveBeenCalledWith({
      data: {
        userAId: TARGET_USER_ID,
        userBId: ACTOR_USER_ID,
        status: MatchStatus.active,
        matchedAt: FIXED_NOW,
        expiresAt: addDays(FIXED_NOW, 7),
      },
      select: expect.any(Object),
    });
    expect(result).toEqual({
      id: MATCH_ID,
      matchedProfile: {
        userId: TARGET_USER_ID,
        handle: 'target_user',
        displayName: 'Target User',
        primaryPhotoUrl: '/uploads/profile-photos/target.jpg',
      },
      matchedAt: FIXED_NOW,
      expiresAt: addDays(FIXED_NOW, 7),
      status: MatchStatus.active,
      conversationStarted: false,
    });
    expectNoRawMatchOrPrivateKeys(result);
  });

  it('does not create a match for one-sided LIKE', async () => {
    const { service, prisma } = createService();
    prisma.like.findFirst.mockResolvedValue(null);

    await expect(
      service.tryCreateMatchFromLike({
        actorUserId: ACTOR_USER_ID,
        targetUserId: TARGET_USER_ID,
        now: FIXED_NOW,
      }),
    ).resolves.toBeNull();

    expect(prisma.match.findFirst).not.toHaveBeenCalled();
    expect(prisma.match.create).not.toHaveBeenCalled();
  });

  it('does not create a match for SKIP/PASS interactions', async () => {
    const { service, prisma } = createService();
    prisma.like.findFirst.mockResolvedValue(null);

    await service.tryCreateMatchFromLike({
      actorUserId: ACTOR_USER_ID,
      targetUserId: TARGET_USER_ID,
      now: FIXED_NOW,
    });

    expect(prisma.like.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kind: LikeKind.like,
        }),
      }),
    );
    expect(prisma.match.create).not.toHaveBeenCalled();
  });

  it('does not create a match when the reciprocal LIKE is expired', async () => {
    const { service, prisma } = createService();
    prisma.like.findFirst.mockResolvedValue(null);

    await service.tryCreateMatchFromLike({
      actorUserId: ACTOR_USER_ID,
      targetUserId: TARGET_USER_ID,
      now: FIXED_NOW,
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
    expect(prisma.match.create).not.toHaveBeenCalled();
  });

  it('returns the existing active match instead of creating a duplicate', async () => {
    const { service, prisma } = createService();
    const existingMatch = makeMatchRecord({
      id: MATCH_ID,
      conversation: {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      },
    });
    prisma.like.findFirst.mockResolvedValue({ id: 'reciprocal-like-id' });
    prisma.match.findFirst.mockResolvedValue(existingMatch);

    await expect(
      service.tryCreateMatchFromLike({
        actorUserId: ACTOR_USER_ID,
        targetUserId: TARGET_USER_ID,
        now: FIXED_NOW,
      }),
    ).resolves.toMatchObject({
      id: MATCH_ID,
      conversationStarted: true,
    });

    expect(prisma.match.create).not.toHaveBeenCalled();
  });

  it('allows a future rematch when older matches are expired', async () => {
    const { service, prisma } = createService();
    prisma.like.findFirst.mockResolvedValue({ id: 'reciprocal-like-id' });
    prisma.match.findFirst.mockResolvedValue(null);
    prisma.match.create.mockImplementation(async (args: MatchCreateArgs) =>
      makeMatchRecord(args.data),
    );

    await service.tryCreateMatchFromLike({
      actorUserId: ACTOR_USER_ID,
      targetUserId: TARGET_USER_ID,
      now: FIXED_NOW,
    });

    expect(prisma.match.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: MatchStatus.active,
          expiresAt: {
            gt: FIXED_NOW,
          },
        }),
      }),
    );
    expect(prisma.match.create).toHaveBeenCalledTimes(1);
  });

  it('normalizes user pairs before writes', async () => {
    const { service, prisma } = createService();
    prisma.like.findFirst.mockResolvedValue({ id: 'reciprocal-like-id' });
    prisma.match.findFirst.mockResolvedValue(null);
    prisma.match.create.mockImplementation(async (args: MatchCreateArgs) =>
      makeMatchRecord(args.data),
    );

    await service.tryCreateMatchFromLike({
      actorUserId: TARGET_USER_ID,
      targetUserId: ACTOR_USER_ID,
      now: FIXED_NOW,
    });

    expect(service.normalizePair(ACTOR_USER_ID, TARGET_USER_ID)).toEqual({
      userAId: TARGET_USER_ID,
      userBId: ACTOR_USER_ID,
    });
    expect(prisma.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userAId: TARGET_USER_ID,
          userBId: ACTOR_USER_ID,
        }),
      }),
    );
  });

  it('rejects self-match normalization', () => {
    const { service } = createService();

    expect(() =>
      service.normalizePair(ACTOR_USER_ID, ACTOR_USER_ID),
    ).toThrow(BadRequestException);
  });

  it('maps active overlap DB conflicts to the existing active match', async () => {
    const { service, prisma } = createService();
    const existingMatch = makeMatchRecord({ id: MATCH_ID });
    prisma.like.findFirst.mockResolvedValue({ id: 'reciprocal-like-id' });
    prisma.match.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingMatch);
    prisma.match.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Constraint failed: matches_no_overlapping_active_pairs',
        {
          code: 'P2004',
          clientVersion: 'test',
          meta: {
            database_error: 'matches_no_overlapping_active_pairs',
          },
        },
      ),
    );

    await expect(
      service.tryCreateMatchFromLike({
        actorUserId: ACTOR_USER_ID,
        targetUserId: TARGET_USER_ID,
        now: FIXED_NOW,
      }),
    ).resolves.toMatchObject({
      id: MATCH_ID,
    });
  });

  it('returns only current user active matches from getMyMatches', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.match.findMany.mockResolvedValue([
      makeMatchRecord({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userAId: TARGET_USER_ID,
        userBId: ACTOR_USER_ID,
      }),
      makeMatchRecord({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        userAId: ACTOR_USER_ID,
        userBId: THIRD_USER_ID,
        userB: makeUser(THIRD_USER_ID, {
          handle: 'third_user',
          displayName: 'Third User',
          photoUrl: '/uploads/profile-photos/third.jpg',
        }),
      }),
      makeMatchRecord({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        userAId: THIRD_USER_ID,
        userBId: FOURTH_USER_ID,
      }),
    ]);

    const result = await service.getMyMatches(CURRENT_USER);

    expect(prisma.match.findMany).toHaveBeenCalledWith({
      where: {
        status: MatchStatus.active,
        expiresAt: {
          gt: FIXED_NOW,
        },
        OR: [
          {
            userAId: ACTOR_USER_ID,
          },
          {
            userBId: ACTOR_USER_ID,
          },
        ],
      },
      select: expect.any(Object),
      orderBy: {
        matchedAt: 'desc',
      },
    });
    expect(result.matches).toHaveLength(2);
    expect(result.matches.map((match) => match.id)).toEqual([
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ]);
    expectNoRawMatchOrPrivateKeys(result);
  });

  it('does not return inactive or deleted matched users', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.match.findMany.mockResolvedValue([
      makeMatchRecord({
        userAId: TARGET_USER_ID,
        userBId: ACTOR_USER_ID,
        userA: makeUser(TARGET_USER_ID, {
          status: UserStatus.disabled,
        }),
      }),
      makeMatchRecord({
        userAId: ACTOR_USER_ID,
        userBId: THIRD_USER_ID,
        userB: makeUser(THIRD_USER_ID, {
          deletedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      }),
    ]);

    await expect(service.getMyMatches(CURRENT_USER)).resolves.toEqual({
      matches: [],
    });
  });

  it('rejects inactive current users in getMyMatches', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.disabled,
      deletedAt: null,
    });

    await expect(service.getMyMatches(CURRENT_USER)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.match.findMany).not.toHaveBeenCalled();
  });
});

function createService() {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    like: {
      findFirst: jest.fn(),
    },
    match: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  return {
    service: new MatchesService(prisma as unknown as PrismaService),
    prisma,
  };
}

function activeUser() {
  return {
    status: UserStatus.active,
    deletedAt: null,
  };
}

function makeMatchRecord(
  overrides: Partial<{
    id: string;
    userAId: string;
    userBId: string;
    status: MatchStatus;
    matchedAt: Date;
    expiresAt: Date;
    conversation: { id: string } | null;
    userA: ReturnType<typeof makeUser>;
    userB: ReturnType<typeof makeUser>;
  }> = {},
) {
  const userAId = overrides.userAId ?? TARGET_USER_ID;
  const userBId = overrides.userBId ?? ACTOR_USER_ID;

  return {
    id: overrides.id ?? MATCH_ID,
    userAId,
    userBId,
    status: overrides.status ?? MatchStatus.active,
    matchedAt: overrides.matchedAt ?? FIXED_NOW,
    expiresAt: overrides.expiresAt ?? addDays(FIXED_NOW, 7),
    conversation: overrides.conversation ?? null,
    userA: overrides.userA ?? makeUser(userAId),
    userB: overrides.userB ?? makeUser(userBId),
  };
}

function makeUser(
  id: string,
  overrides: Partial<{
    status: UserStatus;
    deletedAt: Date | null;
    handle: string;
    displayName: string;
    photoUrl: string;
    privacySettings: {
      profileVisibilityMode: ProfileVisibilityMode;
      showDisplayNameInPrivateMode: boolean;
      showBioInPrivateMode: boolean;
      showLocationInPrivateMode: boolean;
    } | null;
  }> = {},
) {
  const isTarget = id === TARGET_USER_ID;
  const handle =
    overrides.handle ?? (isTarget ? 'target_user' : `user_${id.slice(0, 8)}`);
  const displayName =
    overrides.displayName ?? (isTarget ? 'Target User' : 'Other User');

  return {
    id,
    status: overrides.status ?? UserStatus.active,
    deletedAt: overrides.deletedAt ?? null,
    privacySettings:
      overrides.privacySettings === undefined
        ? {
            profileVisibilityMode: ProfileVisibilityMode.open,
            showDisplayNameInPrivateMode: false,
            showBioInPrivateMode: false,
            showLocationInPrivateMode: false,
          }
        : overrides.privacySettings,
    profile: {
      userId: id,
      handle,
      displayName,
      photos: [
        {
          id: `${id.slice(0, 8)}-photo`,
          publicUrl:
            overrides.photoUrl ??
            (isTarget
              ? '/uploads/profile-photos/target.jpg'
              : '/uploads/profile-photos/other.jpg'),
          blurhash: null,
          isPrimary: true,
          position: 0,
          moderationStatus: PhotoModerationStatus.approved,
          publishedAt: FIXED_NOW,
        },
      ],
    },
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function expectNoRawMatchOrPrivateKeys(value: unknown): void {
  const keys = collectObjectKeys(value);
  const forbiddenKeys = [
    'userAId',
    'userBId',
    'userA',
    'userB',
    'conversation',
    'email',
    'birthDate',
    'password',
    'passwordHash',
    'refreshToken',
    'tokenHash',
    'storageKey',
    'localPath',
    'originalFilename',
    'privacySettings',
    'deletedAt',
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
