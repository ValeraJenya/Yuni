import { PhotoModerationStatus, ProfileVisibilityMode } from '@prisma/client';
import {
  toPublicProfile,
  toPublicProfilePhotos,
  toSelfProfile,
  toSelfProfilePhoto,
  type ProfilePhotoSource,
  type ProfileSource,
} from './user-profile.serializer';

describe('user/profile serializers', () => {
  it('returns public profile data for open profiles and only public photos', () => {
    const result = toPublicProfile(makeProfile(), {
      profileVisibilityMode: ProfileVisibilityMode.open,
    });

    expect(result).toEqual({
      userId: 'user-1',
      handle: 'person_01',
      displayName: 'Person One',
      bio: 'Hello from Yuni',
      gender: 'woman',
      lookingFor: 'relationship',
      city: 'Astrakhan',
      country: 'RU',
      photos: [
        {
          id: 'photo-approved-lower-position',
          publicUrl: '/uploads/profile-photos/approved-lower.jpg',
          blurhash: 'blur-2',
          isPrimary: false,
          position: 1,
        },
        {
          id: 'photo-approved',
          publicUrl: '/uploads/profile-photos/approved.jpg',
          blurhash: 'blur-1',
          isPrimary: true,
          position: 2,
        },
      ],
    });
  });

  it('applies private profile visibility rules to public profile views', () => {
    const hidden = toPublicProfile(makeProfile(), {
      profileVisibilityMode: ProfileVisibilityMode.private,
    });

    expect(hidden).toMatchObject({
      displayName: null,
      bio: null,
      city: null,
      country: null,
      photos: [],
    });

    const partiallyVisible = toPublicProfile(makeProfile(), {
      profileVisibilityMode: ProfileVisibilityMode.private,
      showDisplayNameInPrivateMode: true,
      showBioInPrivateMode: true,
      showLocationInPrivateMode: true,
    });

    expect(partiallyVisible).toMatchObject({
      displayName: 'Person One',
      bio: 'Hello from Yuni',
      city: 'Astrakhan',
      country: 'RU',
      photos: [],
    });
  });

  it('filters and sorts public profile photos', () => {
    expect(toPublicProfilePhotos(makePhotos())).toEqual([
      {
        id: 'photo-approved-lower-position',
        publicUrl: '/uploads/profile-photos/approved-lower.jpg',
        blurhash: 'blur-2',
        isPrimary: false,
        position: 1,
      },
      {
        id: 'photo-approved',
        publicUrl: '/uploads/profile-photos/approved.jpg',
        blurhash: 'blur-1',
        isPrimary: true,
        position: 2,
      },
    ]);
  });

  it('keeps self profile fields and self photo moderation data', () => {
    const result = toSelfProfile(makeProfile());

    expect(result).toEqual({
      userId: 'user-1',
      handle: 'person_01',
      displayName: 'Person One',
      birthDate: new Date('2000-01-01T00:00:00.000Z'),
      bio: 'Hello from Yuni',
      gender: 'woman',
      lookingFor: 'relationship',
      city: 'Astrakhan',
      country: 'RU',
      isDiscoverable: true,
      completedAt: new Date('2026-01-01T00:00:00.000Z'),
      photos: [
        {
          id: 'photo-approved-lower-position',
          publicUrl: '/uploads/profile-photos/approved-lower.jpg',
          blurhash: 'blur-2',
          isPrimary: false,
          position: 1,
          moderationStatus: PhotoModerationStatus.approved,
          publishedAt: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          id: 'photo-approved',
          publicUrl: '/uploads/profile-photos/approved.jpg',
          blurhash: 'blur-1',
          isPrimary: true,
          position: 2,
          moderationStatus: PhotoModerationStatus.approved,
          publishedAt: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          id: 'photo-pending',
          publicUrl: '/uploads/profile-photos/pending.jpg',
          blurhash: null,
          isPrimary: false,
          position: 3,
          moderationStatus: PhotoModerationStatus.pending,
          publishedAt: null,
        },
        {
          id: 'photo-missing-url',
          publicUrl: null,
          blurhash: null,
          isPrimary: false,
          position: 4,
          moderationStatus: PhotoModerationStatus.approved,
          publishedAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ],
    });
  });

  it('maps a single self profile photo without exposing storage fields', () => {
    expect(toSelfProfilePhoto(makePhotos()[1])).toEqual({
      id: 'photo-pending',
      publicUrl: '/uploads/profile-photos/pending.jpg',
      blurhash: null,
      isPrimary: false,
      position: 3,
      moderationStatus: PhotoModerationStatus.pending,
      publishedAt: null,
    });
  });
});

function makeProfile(): ProfileSource {
  return {
    userId: 'user-1',
    handle: 'person_01',
    displayName: 'Person One',
    birthDate: new Date('2000-01-01T00:00:00.000Z'),
    bio: 'Hello from Yuni',
    gender: 'woman',
    lookingFor: 'relationship',
    city: 'Astrakhan',
    country: 'RU',
    isDiscoverable: true,
    completedAt: new Date('2026-01-01T00:00:00.000Z'),
    photos: makePhotos(),
  };
}

function makePhotos(): ProfilePhotoSource[] {
  return [
    {
      id: 'photo-approved',
      publicUrl: '/uploads/profile-photos/approved.jpg',
      blurhash: 'blur-1',
      isPrimary: true,
      position: 2,
      moderationStatus: PhotoModerationStatus.approved,
      publishedAt: new Date('2026-02-01T00:00:00.000Z'),
    },
    {
      id: 'photo-pending',
      publicUrl: '/uploads/profile-photos/pending.jpg',
      blurhash: null,
      isPrimary: false,
      position: 3,
      moderationStatus: PhotoModerationStatus.pending,
      publishedAt: null,
    },
    {
      id: 'photo-approved-lower-position',
      publicUrl: '/uploads/profile-photos/approved-lower.jpg',
      blurhash: 'blur-2',
      isPrimary: false,
      position: 1,
      moderationStatus: PhotoModerationStatus.approved,
      publishedAt: new Date('2026-02-01T00:00:00.000Z'),
    },
    {
      id: 'photo-missing-url',
      publicUrl: null,
      blurhash: null,
      isPrimary: false,
      position: 4,
      moderationStatus: PhotoModerationStatus.approved,
      publishedAt: new Date('2026-02-01T00:00:00.000Z'),
    },
  ];
}
