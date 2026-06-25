import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PhotoModerationStatus, UserStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  PROFILE_PHOTO_MAX_BYTES,
  PROFILE_PHOTO_MAX_COUNT,
  PROFILE_PHOTO_PUBLIC_PATH,
  PROFILE_PHOTO_STORAGE_PREFIX,
} from './media.constants';
import { MediaService } from './media.service';
import type { UploadedProfilePhotoFile } from './types/uploaded-profile-photo-file';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => '11111111-1111-4111-8111-111111111111'),
}));

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn(async () => undefined),
  writeFile: jest.fn(async () => undefined),
  unlink: jest.fn(async () => undefined),
}));

const CURRENT_USER: AuthenticatedUser = {
  id: 'user-1',
  email: 'person@example.com',
};
const FIXED_NOW = new Date('2026-06-06T12:00:00.000Z');

const JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);
const WEBP_BUFFER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

interface ProfilePhotoFixture {
  id: string;
  userId: string;
  storageKey: string;
  publicUrl: string | null;
  blurhash: string | null;
  mimeType: string | null;
  position: number;
  isPrimary: boolean;
  moderationStatus: PhotoModerationStatus;
  approvedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
}

interface ProfileFixture {
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

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
  };
  profile: {
    findUnique: jest.Mock;
  };
  profilePhoto: {
    aggregate: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
}

describe('MediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
    jest.mocked(randomUUID).mockReturnValue('11111111-1111-4111-8111-111111111111');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the current user photos with safe self serialization', async () => {
    const { service, prisma } = createService();
    const photos = [
      makePhoto({ id: 'photo-1', position: 1 }),
      makePhoto({
        id: 'photo-2',
        position: 2,
        publicUrl: null,
        moderationStatus: PhotoModerationStatus.pending,
        publishedAt: null,
      }),
    ];
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.findMany.mockResolvedValue(photos);

    const result = await service.getMyProfilePhotos(CURRENT_USER);

    expect(prisma.profilePhoto.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    expect(result.photos).toEqual([
      {
        id: 'photo-1',
        publicUrl: '/uploads/profile-photos/photo-1.jpg',
        blurhash: 'blur-1',
        isPrimary: true,
        position: 1,
        moderationStatus: PhotoModerationStatus.approved,
        publishedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
      {
        id: 'photo-2',
        publicUrl: null,
        blurhash: 'blur-1',
        isPrimary: true,
        position: 2,
        moderationStatus: PhotoModerationStatus.pending,
        publishedAt: null,
      },
    ]);
    expect(result.photos[0]).not.toHaveProperty('storageKey');
  });

  it('rejects photo upload for inactive users before touching storage', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.disabled,
      deletedAt: null,
    });

    await expect(
      service.uploadProfilePhoto(CURRENT_USER, makeFile()),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects missing and empty files without storage writes', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());

    await expect(
      service.uploadProfilePhoto(CURRENT_USER, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.uploadProfilePhoto(CURRENT_USER, makeFile({ size: 0 })),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.profilePhoto.count).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects unsupported mime types before storage writes', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());

    await expect(
      service.uploadProfilePhoto(
        CURRENT_USER,
        makeFile({ mimetype: 'image/gif' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.profilePhoto.count).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects oversized files before storage writes', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());

    await expect(
      service.uploadProfilePhoto(
        CURRENT_USER,
        makeFile({ size: PROFILE_PHOTO_MAX_BYTES + 1 }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.profilePhoto.count).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects invalid image signatures before storage writes', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());

    await expect(
      service.uploadProfilePhoto(
        CURRENT_USER,
        makeFile({ buffer: Buffer.from('not-an-image') }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.profilePhoto.count).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects uploads at the profile photo limit before storage and create', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.count.mockResolvedValue(PROFILE_PHOTO_MAX_COUNT);

    await expect(
      service.uploadProfilePhoto(CURRENT_USER, makeFile()),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
    expect(prisma.profilePhoto.create).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'JPEG', mimetype: 'image/jpeg', buffer: JPEG_BUFFER },
    { name: 'PNG', mimetype: 'image/png', buffer: PNG_BUFFER },
    { name: 'WebP', mimetype: 'image/webp', buffer: WEBP_BUFFER },
  ])('accepts a valid $name signature', async ({ mimetype, buffer }) => {
    const { service, prisma } = createService();
    const createdPhoto = makePhoto({ mimeType: mimetype });
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.count.mockResolvedValue(0);
    prisma.profilePhoto.aggregate.mockResolvedValue({
      _max: { position: null },
    });
    prisma.profilePhoto.create.mockResolvedValue(createdPhoto);
    prisma.profile.findUnique.mockResolvedValue(
      makeProfile({ photos: [createdPhoto] }),
    );

    const result = await service.uploadProfilePhoto(
      CURRENT_USER,
      makeFile({ mimetype, buffer }),
    );

    expect(writeFile).toHaveBeenCalledWith(expect.any(String), buffer);
    expect(result.photo).not.toHaveProperty('storageKey');
  });

  it('uploads a valid first photo as approved primary media without real file writes', async () => {
    const { service, prisma } = createService();
    const createdPhoto = makePhoto({
      id: 'created-photo',
      storageKey: `${PROFILE_PHOTO_STORAGE_PREFIX}11111111-1111-4111-8111-111111111111.png`,
      publicUrl: `${PROFILE_PHOTO_PUBLIC_PATH}/11111111-1111-4111-8111-111111111111.png`,
      mimeType: 'image/png',
      position: 0,
      isPrimary: true,
      approvedAt: FIXED_NOW,
      publishedAt: FIXED_NOW,
    });
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.count.mockResolvedValue(0);
    prisma.profilePhoto.aggregate.mockResolvedValue({ _max: { position: null } });
    prisma.profilePhoto.create.mockResolvedValue(createdPhoto);
    prisma.profile.findUnique.mockResolvedValue(
      makeProfile({ photos: [createdPhoto] }),
    );

    const result = await service.uploadProfilePhoto(
      CURRENT_USER,
      makeFile({ mimetype: 'image/png' }),
    );

    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining('uploads'),
      { recursive: true },
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('11111111-1111-4111-8111-111111111111.png'),
      PNG_BUFFER,
    );
    expect(prisma.profilePhoto.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        storageKey: `${PROFILE_PHOTO_STORAGE_PREFIX}11111111-1111-4111-8111-111111111111.png`,
        publicUrl: `${PROFILE_PHOTO_PUBLIC_PATH}/11111111-1111-4111-8111-111111111111.png`,
        mimeType: 'image/png',
        position: 0,
        isPrimary: true,
        moderationStatus: PhotoModerationStatus.approved,
        approvedAt: FIXED_NOW,
        publishedAt: FIXED_NOW,
      },
    });
    expect(result.photo).toMatchObject({
      id: 'created-photo',
      isPrimary: true,
      position: 0,
      moderationStatus: PhotoModerationStatus.approved,
      publishedAt: FIXED_NOW,
    });
    expect(result.photo).not.toHaveProperty('storageKey');
    expect(result.profile.photos).toHaveLength(1);
  });

  it('uploads later photos as non-primary at the next position', async () => {
    const { service, prisma } = createService();
    const createdPhoto = makePhoto({
      id: 'created-photo',
      position: 4,
      isPrimary: false,
    });
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.count.mockResolvedValue(2);
    prisma.profilePhoto.aggregate.mockResolvedValue({ _max: { position: 3 } });
    prisma.profilePhoto.create.mockResolvedValue(createdPhoto);
    prisma.profile.findUnique.mockResolvedValue(
      makeProfile({ photos: [createdPhoto] }),
    );

    await service.uploadProfilePhoto(CURRENT_USER, makeFile());

    expect(prisma.profilePhoto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          position: 4,
          isPrimary: false,
        }),
      }),
    );
  });

  it('removes the uploaded file best-effort when DB create fails', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.count.mockResolvedValue(0);
    prisma.profilePhoto.aggregate.mockResolvedValue({ _max: { position: null } });
    prisma.profilePhoto.create.mockRejectedValue(new Error('db failed'));

    await expect(
      service.uploadProfilePhoto(CURRENT_USER, makeFile({ mimetype: 'image/jpeg' })),
    ).rejects.toThrow('db failed');

    expect(unlink).toHaveBeenCalledWith(
      expect.stringContaining('11111111-1111-4111-8111-111111111111.jpg'),
    );
  });

  it('rejects setting a missing or non-owned photo as primary', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.setProfilePhotoPrimary(CURRENT_USER, 'missing-photo'),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.profilePhoto.findUnique.mockResolvedValueOnce(
      makePhoto({ userId: 'user-2' }),
    );

    await expect(
      service.setProfilePhotoPrimary(CURRENT_USER, 'other-photo'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.profilePhoto.updateMany).not.toHaveBeenCalled();
    expect(prisma.profilePhoto.update).not.toHaveBeenCalled();
  });

  it('sets an owned photo as primary and returns safe profile/photo views', async () => {
    const { service, prisma } = createService();
    const selectedPhoto = makePhoto({
      id: 'photo-selected',
      isPrimary: false,
      position: 2,
    });
    const photos = [
      makePhoto({ id: 'photo-old-primary', position: 1, isPrimary: false }),
      { ...selectedPhoto, isPrimary: true },
    ];
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.findUnique.mockResolvedValue(selectedPhoto);
    prisma.profilePhoto.updateMany.mockResolvedValue({ count: 1 });
    prisma.profilePhoto.update.mockResolvedValue({ ...selectedPhoto, isPrimary: true });
    prisma.profile.findUnique.mockResolvedValue(makeProfile({ photos }));
    prisma.profilePhoto.findMany.mockResolvedValue(photos);

    const result = await service.setProfilePhotoPrimary(
      CURRENT_USER,
      'photo-selected',
    );

    expect(prisma.profilePhoto.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        isPrimary: true,
      },
      data: { isPrimary: false },
    });
    expect(prisma.profilePhoto.update).toHaveBeenCalledWith({
      where: { id: 'photo-selected' },
      data: { isPrimary: true },
    });
    expect(result.profile.photos[1]).toMatchObject({
      id: 'photo-selected',
      isPrimary: true,
    });
    expect(result.photos[1]).not.toHaveProperty('storageKey');
  });

  it('rejects deleting a missing or non-owned photo', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.deleteProfilePhoto(CURRENT_USER, 'missing-photo'),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.profilePhoto.findUnique.mockResolvedValueOnce(
      makePhoto({ userId: 'user-2' }),
    );

    await expect(
      service.deleteProfilePhoto(CURRENT_USER, 'other-photo'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.profilePhoto.delete).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
  });

  it('deletes an owned primary photo, promotes the next photo, and cleans storage', async () => {
    const { service, prisma } = createService();
    const deletedPhoto = makePhoto({
      id: 'photo-primary',
      storageKey: `${PROFILE_PHOTO_STORAGE_PREFIX}11111111-1111-4111-8111-111111111111.jpg`,
      isPrimary: true,
      position: 1,
    });
    const nextPhoto = makePhoto({
      id: 'photo-next',
      isPrimary: false,
      position: 2,
    });
    const remainingPhotos = [{ ...nextPhoto, isPrimary: true }];
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.findUnique.mockResolvedValue(deletedPhoto);
    prisma.profilePhoto.findFirst.mockResolvedValue(nextPhoto);
    prisma.profilePhoto.update.mockResolvedValue({ ...nextPhoto, isPrimary: true });
    prisma.profile.findUnique.mockResolvedValue(
      makeProfile({ photos: remainingPhotos }),
    );
    prisma.profilePhoto.findMany.mockResolvedValue(remainingPhotos);

    const result = await service.deleteProfilePhoto(CURRENT_USER, 'photo-primary');

    expect(prisma.profilePhoto.delete).toHaveBeenCalledWith({
      where: { id: 'photo-primary' },
    });
    expect(prisma.profilePhoto.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    expect(prisma.profilePhoto.update).toHaveBeenCalledWith({
      where: { id: 'photo-next' },
      data: { isPrimary: true },
    });
    expect(unlink).toHaveBeenCalledWith(
      expect.stringContaining('11111111-1111-4111-8111-111111111111.jpg'),
    );
    expect(result).toMatchObject({
      success: true,
      photos: [{ id: 'photo-next', isPrimary: true }],
    });
  });

  it('does not fail delete when storage cleanup fails', async () => {
    const { service, prisma } = createService();
    const deletedPhoto = makePhoto({
      id: 'photo-delete',
      storageKey: `${PROFILE_PHOTO_STORAGE_PREFIX}11111111-1111-4111-8111-111111111111.webp`,
      isPrimary: false,
    });
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.profilePhoto.findUnique.mockResolvedValue(deletedPhoto);
    jest.mocked(unlink).mockRejectedValueOnce(new Error('file missing'));
    prisma.profile.findUnique.mockResolvedValue(makeProfile({ photos: [] }));
    prisma.profilePhoto.findMany.mockResolvedValue([]);

    await expect(
      service.deleteProfilePhoto(CURRENT_USER, 'photo-delete'),
    ).resolves.toMatchObject({
      success: true,
      photos: [],
    });
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
    profilePhoto: {
      aggregate: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(
    async (
      operation:
        | Promise<unknown>[]
        | ((tx: PrismaMock) => Promise<unknown>),
    ) => {
      if (typeof operation === 'function') {
        return operation(prisma);
      }

      return Promise.all(operation);
    },
  );

  return {
    service: new MediaService(prisma as unknown as PrismaService),
    prisma,
  };
}

function activeUser() {
  return {
    status: UserStatus.active,
    deletedAt: null,
  };
}

function makeFile(
  overrides: Partial<UploadedProfilePhotoFile> = {},
): UploadedProfilePhotoFile {
  const mimetype = overrides.mimetype ?? 'image/jpeg';
  const buffer =
    overrides.buffer ??
    (mimetype === 'image/png'
      ? PNG_BUFFER
      : mimetype === 'image/webp'
        ? WEBP_BUFFER
        : JPEG_BUFFER);

  return {
    buffer,
    mimetype,
    size: overrides.size ?? buffer.length,
  };
}

function makeProfile(overrides: Partial<ProfileFixture> = {}): ProfileFixture {
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
    photos: [],
    ...overrides,
  };
}

function makePhoto(
  overrides: Partial<ProfilePhotoFixture> = {},
): ProfilePhotoFixture {
  return {
    id: 'photo-1',
    userId: 'user-1',
    storageKey: `${PROFILE_PHOTO_STORAGE_PREFIX}photo-1.jpg`,
    publicUrl: '/uploads/profile-photos/photo-1.jpg',
    blurhash: 'blur-1',
    mimeType: 'image/jpeg',
    position: 1,
    isPrimary: true,
    moderationStatus: PhotoModerationStatus.approved,
    approvedAt: new Date('2026-02-01T00:00:00.000Z'),
    publishedAt: new Date('2026-02-01T00:00:00.000Z'),
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    ...overrides,
  };
}
