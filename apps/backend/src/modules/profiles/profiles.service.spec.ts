import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { PrismaService } from '../../common/prisma/prisma.service';
import {
  PhotoModerationStatus,
  ProfileVisibilityMode,
  UserStatus,
} from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { ModerationService } from '../moderation/moderation.service';
import { ProfilesService } from './profiles.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const CURRENT_USER: AuthenticatedUser = {
  id: 'user-1',
  email: 'person@example.com',
};

interface ProfilePhotoFixture {
  id: string;
  publicUrl: string | null;
  blurhash: string | null;
  position: number;
  isPrimary: boolean;
  moderationStatus: PhotoModerationStatus;
  publishedAt: Date | null;
  createdAt: Date;
}

interface SelfProfileFixture {
  userId: string;
  handle: string;
  displayName: string;
  birthDate: Date;
  bio: string | null;
  gender: string | null;
  lookingFor: string | null;
  city: string | null;
  country: string | null;
  isDiscoverable: boolean;
  completedAt: Date | null;
  photos: ProfilePhotoFixture[];
}

interface PublicProfileFixture extends SelfProfileFixture {
  user: {
    privacySettings: {
      profileVisibilityMode: ProfileVisibilityMode;
      showDisplayNameInPrivateMode?: boolean;
      showBioInPrivateMode?: boolean;
      showLocationInPrivateMode?: boolean;
    } | null;
  };
}

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
  };
  profile: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
}

interface ModerationServiceMock {
  hasBlockBetween: jest.Mock;
}

describe('ProfilesService', () => {
  it('returns the current user self profile with self photo fields', async () => {
    const { service, prisma } = createService();
    const profile = makeSelfProfile();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValue(profile);

    const result = await service.getMe(CURRENT_USER);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        status: true,
        deletedAt: true,
      },
    });
    expect(prisma.profile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { photos: true },
    });
    expect(result.profile).toMatchObject({
      userId: 'user-1',
      handle: 'person_01',
      displayName: 'Person One',
      birthDate: profile.birthDate,
      bio: 'Self profile bio',
      photos: [
        {
          id: 'photo-approved',
          moderationStatus: PhotoModerationStatus.approved,
          publishedAt: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          id: 'photo-pending',
          moderationStatus: PhotoModerationStatus.pending,
          publishedAt: null,
        },
      ],
    });
    expect(result.profile.photos[0]).not.toHaveProperty('storageKey');
  });

  it('rejects self profile access for missing, disabled, or deleted users', async () => {
    const { service, prisma } = createService();

    for (const user of [
      null,
      { status: UserStatus.disabled, deletedAt: null },
      { status: UserStatus.active, deletedAt: new Date('2026-01-01T00:00:00.000Z') },
    ]) {
      prisma.user.findUnique.mockResolvedValueOnce(user);

      await expect(service.getMe(CURRENT_USER)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    }

    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
  });

  it('returns not found when the current user has no profile row', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValue(null);

    await expect(service.getMe(CURRENT_USER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates only the current user profile with provided service fields', async () => {
    const { service, prisma } = createService();
    const updatedProfile = makeSelfProfile({
      displayName: 'Updated Person',
      bio: null,
      city: 'Tbilisi',
      isDiscoverable: false,
    });
    const dto: UpdateProfileDto = {
      displayName: 'Updated Person',
      bio: null,
      city: 'Tbilisi',
      isDiscoverable: false,
    };

    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique.mockResolvedValueOnce({ userId: 'user-1' });
    prisma.profile.update.mockResolvedValue(updatedProfile);

    const result = await service.updateMe(CURRENT_USER, dto);

    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: {
        displayName: 'Updated Person',
        bio: null,
        city: 'Tbilisi',
        isDiscoverable: false,
      },
      include: { photos: true },
    });
    expect(result.profile).toMatchObject({
      userId: 'user-1',
      displayName: 'Updated Person',
      bio: null,
      city: 'Tbilisi',
      isDiscoverable: false,
    });
  });

  it('does not issue an update query when no profile fields are provided', async () => {
    const { service, prisma } = createService();
    const profile = makeSelfProfile();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findUnique
      .mockResolvedValueOnce({ userId: 'user-1' })
      .mockResolvedValueOnce(profile);

    const result = await service.updateMe(CURRENT_USER, {});

    expect(prisma.profile.update).not.toHaveBeenCalled();
    expect(result.profile.userId).toBe('user-1');
  });

  it('returns a public profile by case-insensitive handle with public privacy applied', async () => {
    const { service, prisma, moderationService } = createService();
    const profile = makePublicProfile();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findFirst.mockResolvedValue(profile);

    const result = await service.getByHandle('PERSON_01', CURRENT_USER);

    expect(prisma.profile.findFirst).toHaveBeenCalledWith({
      where: {
        handle: {
          equals: 'PERSON_01',
          mode: 'insensitive',
        },
      },
      include: {
        photos: true,
        user: {
          select: {
            privacySettings: true,
          },
        },
      },
    });
    expect(result.profile).toEqual({
      userId: 'user-2',
      handle: 'person_01',
      displayName: 'Person One',
      bio: 'Self profile bio',
      gender: 'woman',
      lookingFor: 'relationship',
      city: 'Astrakhan',
      country: 'RU',
      photos: [
        {
          id: 'photo-approved',
          publicUrl: '/uploads/profile-photos/approved.jpg',
          blurhash: 'blur-1',
          isPrimary: true,
          position: 1,
        },
      ],
    });
    expect(result.profile).not.toHaveProperty('birthDate');
    expect(moderationService.hasBlockBetween).toHaveBeenCalledWith(
      CURRENT_USER.id,
      profile.userId,
    );
  });

  it('hides blocked public profiles behind a not-found style response', async () => {
    const { service, prisma, moderationService } = createService();
    const profile = makePublicProfile();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profile.findFirst.mockResolvedValue(profile);
    moderationService.hasBlockBetween.mockResolvedValue(true);

    await expect(
      service.getByHandle(profile.handle, CURRENT_USER),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects public access to private and non-discoverable profiles', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());

    for (const profile of [
      makePublicProfile({
        user: {
          privacySettings: {
            profileVisibilityMode: ProfileVisibilityMode.private,
          },
        },
      }),
      makePublicProfile({ isDiscoverable: false }),
    ]) {
      prisma.profile.findFirst.mockResolvedValueOnce(profile);

      await expect(
        service.getByHandle(profile.handle, CURRENT_USER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }
  });
});

function createService() {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const moderationService: ModerationServiceMock = {
    hasBlockBetween: jest.fn().mockResolvedValue(false),
  };

  return {
    service: new ProfilesService(
      prisma as unknown as PrismaService,
      moderationService as unknown as ModerationService,
    ),
    prisma,
    moderationService,
  };
}

function activeUser() {
  return {
    status: UserStatus.active,
    deletedAt: null,
  };
}

function makeSelfProfile(
  overrides: Partial<SelfProfileFixture> = {},
): SelfProfileFixture {
  return {
    userId: 'user-1',
    handle: 'person_01',
    displayName: 'Person One',
    birthDate: new Date('2000-01-01T00:00:00.000Z'),
    bio: 'Self profile bio',
    gender: 'woman',
    lookingFor: 'relationship',
    city: 'Astrakhan',
    country: 'RU',
    isDiscoverable: true,
    completedAt: new Date('2026-01-01T00:00:00.000Z'),
    photos: [
      makePhoto({
        id: 'photo-approved',
        position: 1,
        moderationStatus: PhotoModerationStatus.approved,
        publishedAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
      makePhoto({
        id: 'photo-pending',
        publicUrl: '/uploads/profile-photos/pending.jpg',
        blurhash: null,
        position: 2,
        isPrimary: false,
        moderationStatus: PhotoModerationStatus.pending,
        publishedAt: null,
      }),
    ],
    ...overrides,
  };
}

function makePublicProfile(
  overrides: Partial<PublicProfileFixture> = {},
): PublicProfileFixture {
  return {
    ...makeSelfProfile({ userId: 'user-2' }),
    user: {
      privacySettings: {
        profileVisibilityMode: ProfileVisibilityMode.open,
      },
    },
    ...overrides,
  };
}

function makePhoto(
  overrides: Partial<ProfilePhotoFixture> = {},
): ProfilePhotoFixture {
  return {
    id: 'photo-approved',
    publicUrl: '/uploads/profile-photos/approved.jpg',
    blurhash: 'blur-1',
    position: 1,
    isPrimary: true,
    moderationStatus: PhotoModerationStatus.approved,
    publishedAt: new Date('2026-02-01T00:00:00.000Z'),
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    ...overrides,
  };
}
