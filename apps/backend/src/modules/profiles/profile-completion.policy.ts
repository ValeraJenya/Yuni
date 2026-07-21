import { PhotoModerationStatus, Prisma } from '@prisma/client';

export const PROFILE_COMPLETION_FIELDS = [
  'displayName',
  'birthDate',
  'bio',
  'gender',
  'lookingFor',
  'city',
  'country',
  'photo',
] as const;

export type ProfileCompletionField = (typeof PROFILE_COMPLETION_FIELDS)[number];

export interface ProfileCompletionResult {
  isComplete: boolean;
  missingFields: ProfileCompletionField[];
  percentage: number;
}

export interface ProfileCompletionSource {
  displayName: string | null | undefined;
  birthDate: Date | null | undefined;
  bio: string | null | undefined;
  gender: string | null | undefined;
  lookingFor: string | null | undefined;
  city: string | null | undefined;
  country: string | null | undefined;
  photos: ProfileCompletionPhotoSource[];
}

interface ProfileCompletionPhotoSource {
  publicUrl: string | null;
  moderationStatus: PhotoModerationStatus;
  publishedAt: Date | null;
}

const isFilledString = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const isQualifyingPhoto = (photo: ProfileCompletionPhotoSource): boolean =>
  photo.publicUrl !== null &&
  photo.moderationStatus === PhotoModerationStatus.approved &&
  photo.publishedAt !== null;

export function calculateProfileCompletion(
  profile: ProfileCompletionSource,
): ProfileCompletionResult {
  const missingFields: ProfileCompletionField[] = [];

  if (!isFilledString(profile.displayName)) {
    missingFields.push('displayName');
  }
  if (!(profile.birthDate instanceof Date) || Number.isNaN(profile.birthDate.getTime())) {
    missingFields.push('birthDate');
  }
  if (!isFilledString(profile.bio)) {
    missingFields.push('bio');
  }
  if (!isFilledString(profile.gender)) {
    missingFields.push('gender');
  }
  if (!isFilledString(profile.lookingFor)) {
    missingFields.push('lookingFor');
  }
  if (!isFilledString(profile.city)) {
    missingFields.push('city');
  }
  if (!isFilledString(profile.country)) {
    missingFields.push('country');
  }
  if (!profile.photos.some(isQualifyingPhoto)) {
    missingFields.push('photo');
  }

  const completedCount = PROFILE_COMPLETION_FIELDS.length - missingFields.length;

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    percentage: Math.round(
      (completedCount / PROFILE_COMPLETION_FIELDS.length) * 100,
    ),
  };
}

export function buildQualifyingProfilePhotoWhere(): Prisma.ProfilePhotoWhereInput {
  return {
    publicUrl: {
      not: null,
    },
    moderationStatus: PhotoModerationStatus.approved,
    publishedAt: {
      not: null,
    },
  };
}

export function buildProfileCompletionWhere(): Prisma.ProfileWhereInput {
  // Profile writes trim nullable strings, while DB CHECK constraints reject
  // whitespace-only non-null values. Non-null is therefore equivalent to the
  // trimmed-string predicate used by calculateProfileCompletion().
  return {
    displayName: {
      not: '',
    },
    bio: {
      not: null,
    },
    gender: {
      not: null,
    },
    lookingFor: {
      not: null,
    },
    city: {
      not: null,
    },
    country: {
      not: null,
    },
    photos: {
      some: buildQualifyingProfilePhotoWhere(),
    },
  };
}
