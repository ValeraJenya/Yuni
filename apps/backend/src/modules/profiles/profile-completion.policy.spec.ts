import { PhotoModerationStatus } from '@prisma/client';
import {
  buildProfileCompletionWhere,
  buildQualifyingProfilePhotoWhere,
  calculateProfileCompletion,
  type ProfileCompletionSource,
} from './profile-completion.policy';

describe('profile completion policy', () => {
  it('returns 100% for all required fields and a qualifying non-primary photo', () => {
    expect(calculateProfileCompletion(makeProfile())).toEqual({
      isComplete: true,
      missingFields: [],
      percentage: 100,
    });
  });

  it('reports the six gates missing immediately after registration', () => {
    const result = calculateProfileCompletion(
      makeProfile({
        bio: null,
        gender: null,
        lookingFor: null,
        city: null,
        country: null,
        photos: [],
      }),
    );

    expect(result).toEqual({
      isComplete: false,
      missingFields: ['bio', 'gender', 'lookingFor', 'city', 'country', 'photo'],
      percentage: 25,
    });
  });

  it('treats null, empty, whitespace-only and invalid dates as missing in stable order', () => {
    const result = calculateProfileCompletion(
      makeProfile({
        displayName: '   ',
        birthDate: new Date('invalid'),
        bio: null,
        gender: '',
        lookingFor: '\t',
        city: '  ',
        country: undefined,
        photos: [],
      }),
    );

    expect(result).toEqual({
      isComplete: false,
      missingFields: [
        'displayName',
        'birthDate',
        'bio',
        'gender',
        'lookingFor',
        'city',
        'country',
        'photo',
      ],
      percentage: 0,
    });
  });

  it.each([
    {
      publicUrl: null,
      moderationStatus: PhotoModerationStatus.approved,
      publishedAt: new Date(),
    },
    {
      publicUrl: '/photo.jpg',
      moderationStatus: PhotoModerationStatus.pending,
      publishedAt: new Date(),
    },
    {
      publicUrl: '/photo.jpg',
      moderationStatus: PhotoModerationStatus.rejected,
      publishedAt: new Date(),
    },
    {
      publicUrl: '/photo.jpg',
      moderationStatus: PhotoModerationStatus.approved,
      publishedAt: null,
    },
  ])('rejects a non-qualifying photo %#', (photo) => {
    expect(calculateProfileCompletion(makeProfile({ photos: [photo] }))).toEqual({
      isComplete: false,
      missingFields: ['photo'],
      percentage: 88,
    });
  });

  it('builds the reusable Prisma field and photo predicates', () => {
    const photoWhere = {
      publicUrl: { not: null },
      moderationStatus: PhotoModerationStatus.approved,
      publishedAt: { not: null },
    };

    expect(buildQualifyingProfilePhotoWhere()).toEqual(photoWhere);
    expect(buildProfileCompletionWhere()).toEqual({
      displayName: { not: '' },
      bio: { not: null },
      gender: { not: null },
      lookingFor: { not: null },
      city: { not: null },
      country: { not: null },
      photos: { some: photoWhere },
    });
  });
});

function makeProfile(
  overrides: Partial<ProfileCompletionSource> = {},
): ProfileCompletionSource {
  return {
    displayName: 'Person One',
    birthDate: new Date('2000-01-01T00:00:00.000Z'),
    bio: 'Hello',
    gender: 'woman',
    lookingFor: 'relationship',
    city: 'Astrakhan',
    country: 'RU',
    photos: [
      {
        publicUrl: '/uploads/profile-photos/photo.jpg',
        moderationStatus: PhotoModerationStatus.approved,
        publishedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ],
    ...overrides,
  };
}
