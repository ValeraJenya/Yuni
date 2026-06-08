import { UnauthorizedException } from '@nestjs/common';
import {
  MatchStatus,
  PhotoModerationStatus,
  ProfileVisibilityMode,
  UserStatus,
} from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DiscoveryService } from './discovery.service';

const CURRENT_USER: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'person@example.com',
};
const FIRST_PROFILE_USER_ID = '22222222-2222-4222-8222-222222222222';
const SECOND_PROFILE_USER_ID = '33333333-3333-4333-8333-333333333333';
const FIXED_NOW = new Date('2026-06-08T12:00:00.000Z');

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
  };
  profile: {
    findMany: jest.Mock;
  };
}

interface DiscoveryProfileFixture {
  userId: string;
  handle: string;
  displayName: string;
  birthDate: Date;
  bio: string | null;
  gender: string | null;
  lookingFor: string | null;
  city: string | null;
  country: string | null;
  createdAt: Date;
  photos: Array<{
    publicUrl: string | null;
  }>;
}

describe('DiscoveryService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('excludes self, inactive users, and deleted users in the query', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([]);

    await service.getCards(CURRENT_USER, {});

    const where = getFindManyWhere(prisma);
    expect(where).toMatchObject({
      userId: {
        not: CURRENT_USER.id,
      },
      user: {
        status: UserStatus.active,
        deletedAt: null,
      },
    });
  });

  it('rejects inactive current users before discovery lookup', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.disabled,
      deletedAt: null,
    });

    await expect(service.getCards(CURRENT_USER, {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.profile.findMany).not.toHaveBeenCalled();
  });

  it('excludes non-discoverable, incomplete, private, and hidden profiles', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([]);

    await service.getCards(CURRENT_USER, {});

    const where = getFindManyWhere(prisma);
    expect(where).toMatchObject({
      isDiscoverable: true,
      completedAt: {
        not: null,
      },
      user: {
        privacySettings: {
          is: {
            profileVisibilityMode: ProfileVisibilityMode.open,
            discoverable: true,
          },
        },
      },
    });
  });

  it('requires at least one approved published public photo', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([]);

    await service.getCards(CURRENT_USER, {});

    const where = getFindManyWhere(prisma);
    expect(where).toMatchObject({
      photos: {
        some: {
          publicUrl: {
            not: null,
          },
          moderationStatus: PhotoModerationStatus.approved,
          publishedAt: {
            not: null,
          },
        },
      },
    });
  });

  it('excludes users blocked in either direction', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([]);

    await service.getCards(CURRENT_USER, {});

    const where = getFindManyWhere(prisma);
    expect(where).toMatchObject({
      user: {
        blockedUsers: {
          none: {
            blockedUserId: CURRENT_USER.id,
          },
        },
        blockedByUsers: {
          none: {
            blockerUserId: CURRENT_USER.id,
          },
        },
      },
    });
  });

  it('excludes active LIKE cooldowns from the current user', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([]);

    await service.getCards(CURRENT_USER, {});

    const where = getFindManyWhere(prisma);
    expect(where).toMatchObject({
      user: {
        likesReceived: {
          none: {
            likerUserId: CURRENT_USER.id,
            expiresAt: {
              gt: FIXED_NOW,
            },
          },
        },
      },
    });
  });

  it('excludes active SKIP/PASS cooldowns through the same active interaction filter', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([]);

    await service.getCards(CURRENT_USER, {});

    const where = getFindManyWhere(prisma);
    expect(where.user).toMatchObject({
      likesReceived: {
        none: {
          likerUserId: CURRENT_USER.id,
          expiresAt: {
            gt: FIXED_NOW,
          },
        },
      },
    });
    expect(where.user.likesReceived.none).not.toHaveProperty('kind');
  });

  it('does not exclude expired LIKE/SKIP interactions', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([makeProfile()]);

    await expect(service.getCards(CURRENT_USER, {})).resolves.toMatchObject({
      cards: [
        {
          userId: FIRST_PROFILE_USER_ID,
        },
      ],
    });

    const where = getFindManyWhere(prisma);
    expect(where.user.likesReceived.none.expiresAt).toEqual({
      gt: FIXED_NOW,
    });
  });

  it('excludes active matches in either normalized pair direction', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([]);

    await service.getCards(CURRENT_USER, {});

    const where = getFindManyWhere(prisma);
    expect(where).toMatchObject({
      user: {
        matchesAsUserA: {
          none: {
            userBId: CURRENT_USER.id,
            status: MatchStatus.active,
            expiresAt: {
              gt: FIXED_NOW,
            },
          },
        },
        matchesAsUserB: {
          none: {
            userAId: CURRENT_USER.id,
            status: MatchStatus.active,
            expiresAt: {
              gt: FIXED_NOW,
            },
          },
        },
      },
    });
  });

  it('does not exclude expired matches', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([makeProfile()]);

    await expect(service.getCards(CURRENT_USER, {})).resolves.toMatchObject({
      cards: [
        {
          userId: FIRST_PROFILE_USER_ID,
        },
      ],
    });

    const where = getFindManyWhere(prisma);
    expect(where.user.matchesAsUserA.none.expiresAt).toEqual({
      gt: FIXED_NOW,
    });
    expect(where.user.matchesAsUserB.none.expiresAt).toEqual({
      gt: FIXED_NOW,
    });
  });

  it('returns a safe response shape without raw birthDate or private fields', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([
      makeProfile({
        birthDate: new Date('2001-06-09T00:00:00.000Z'),
        photos: [
          {
            publicUrl: 'https://cdn.example.com/photo-1.jpg',
          },
        ],
      }),
    ]);

    const result = await service.getCards(CURRENT_USER, {});

    expect(result).toEqual({
      cards: [
        {
          userId: FIRST_PROFILE_USER_ID,
          handle: 'first_profile',
          displayName: 'First Profile',
          bio: 'Hello from Yuni',
          gender: 'female',
          lookingFor: 'relationship',
          city: 'Astana',
          country: 'KZ',
          age: 24,
          primaryPhotoUrl: 'https://cdn.example.com/photo-1.jpg',
          photos: [
            {
              publicUrl: 'https://cdn.example.com/photo-1.jpg',
            },
          ],
        },
      ],
      nextCursor: null,
    });
    expectNoForbiddenKeys(result);
  });

  it('computes age from birthDate without exposing raw birthDate', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValue([
      makeProfile({
        birthDate: new Date('2000-06-08T00:00:00.000Z'),
      }),
    ]);

    const result = await service.getCards(CURRENT_USER, {});

    expect(result.cards[0]).toMatchObject({
      age: 26,
    });
    expect(collectObjectKeys(result)).not.toContain('birthDate');
  });

  it('supports cursor pagination with limit, max limit, and nextCursor', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findMany.mockResolvedValueOnce([
      makeProfile({ userId: FIRST_PROFILE_USER_ID }),
      makeProfile({
        userId: SECOND_PROFILE_USER_ID,
        handle: 'second_profile',
        displayName: 'Second Profile',
      }),
    ]);

    const firstPage = await service.getCards(CURRENT_USER, {
      limit: 1,
      cursor: '  ',
    });

    expect(firstPage.cards).toHaveLength(1);
    expect(firstPage.nextCursor).toBe(FIRST_PROFILE_USER_ID);
    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
      }),
    );

    prisma.profile.findMany.mockResolvedValueOnce([]);

    await service.getCards(CURRENT_USER, {
      limit: 99,
      cursor: SECOND_PROFILE_USER_ID,
    });

    expect(prisma.profile.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cursor: {
          userId: SECOND_PROFILE_USER_ID,
        },
        skip: 1,
        take: 21,
      }),
    );
  });
});

function createService() {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      findMany: jest.fn(),
    },
  };

  return {
    service: new DiscoveryService(prisma as unknown as PrismaService),
    prisma,
  };
}

function activeUser() {
  return {
    status: UserStatus.active,
    deletedAt: null,
  };
}

function makeProfile(
  overrides: Partial<DiscoveryProfileFixture> = {},
): DiscoveryProfileFixture {
  const base: DiscoveryProfileFixture = {
    userId: FIRST_PROFILE_USER_ID,
    handle: 'first_profile',
    displayName: 'First Profile',
    birthDate: new Date('2000-06-08T00:00:00.000Z'),
    bio: 'Hello from Yuni',
    gender: 'female',
    lookingFor: 'relationship',
    city: 'Astana',
    country: 'KZ',
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    photos: [
      {
        publicUrl: 'https://cdn.example.com/photo.jpg',
      },
    ],
  };

  return {
    ...base,
    ...overrides,
  };
}

function getFindManyWhere(prisma: PrismaMock) {
  return prisma.profile.findMany.mock.calls[0][0].where;
}

function expectNoForbiddenKeys(value: unknown): void {
  const keys = collectObjectKeys(value);
  const forbiddenKeys = [
    'birthDate',
    'email',
    'password',
    'passwordHash',
    'hash',
    'refreshToken',
    'tokenHash',
    'storageKey',
    'localPath',
    'originalFilename',
    'privacySettings',
    'blockedUsers',
    'blockedByUsers',
    'moderationStatus',
    'publishedAt',
    'createdAt',
    'updatedAt',
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
