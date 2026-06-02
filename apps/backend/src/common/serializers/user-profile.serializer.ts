import {
  PhotoModerationStatus,
  ProfileVisibilityMode,
  UserStatus,
} from '@prisma/client';

export interface SafeAuthUser {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  profile: {
    handle: string;
    displayName: string;
  } | null;
}

export interface AuthUserSource {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  profile: {
    handle: string;
    displayName: string;
  } | null;
}

export interface ProfileSource {
  userId: string;
  handle: string;
  displayName: string;
  birthDate?: Date;
  bio?: string | null;
  gender?: string | null;
  lookingFor?: string | null;
  city?: string | null;
  country?: string | null;
  isDiscoverable?: boolean;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  photos?: ProfilePhotoSource[];
}

export interface ProfilePhotoSource {
  id: string;
  publicUrl: string | null;
  blurhash: string | null;
  position: number;
  isPrimary: boolean;
  moderationStatus: PhotoModerationStatus;
  publishedAt: Date | null;
}

export interface ProfilePrivacySource {
  profileVisibilityMode: ProfileVisibilityMode;
  anonymousAvatarKey?: string | null;
  showDisplayNameInPrivateMode?: boolean;
  showBioInPrivateMode?: boolean;
  showLocationInPrivateMode?: boolean;
}

export interface PublicProfileView {
  userId: string;
  handle: string;
  displayName: string | null;
  bio: string | null;
  gender: string | null;
  lookingFor: string | null;
  city: string | null;
  country: string | null;
  photos: PublicProfilePhotoView[];
}

export interface CompactProfileView {
  userId: string;
  handle: string;
  displayName: string | null;
  primaryPhotoUrl: string | null;
}

export interface SelfProfileView {
  userId: string;
  handle: string;
  displayName: string;
  birthDate: Date | undefined;
  bio: string | null;
  gender: string | null;
  lookingFor: string | null;
  city: string | null;
  country: string | null;
  isDiscoverable: boolean | undefined;
  completedAt: Date | null | undefined;
  photos: SelfProfilePhotoView[];
}

export interface PublicProfilePhotoView {
  id: string;
  publicUrl: string;
  blurhash: string | null;
  isPrimary: boolean;
  position: number;
}

export interface SelfProfilePhotoView {
  id: string;
  publicUrl: string | null;
  blurhash: string | null;
  isPrimary: boolean;
  position: number;
  moderationStatus: PhotoModerationStatus;
  publishedAt: Date | null;
}

export function toSafeAuthUser(user: AuthUserSource): SafeAuthUser {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt,
    profile: user.profile
      ? {
          handle: user.profile.handle,
          displayName: user.profile.displayName,
        }
      : null,
  };
}

export function toPublicProfile(
  profile: ProfileSource,
  privacy?: ProfilePrivacySource | null,
): PublicProfileView {
  const isPrivate = privacy?.profileVisibilityMode === ProfileVisibilityMode.private;

  return {
    userId: profile.userId,
    handle: profile.handle,
    displayName:
      !isPrivate || privacy?.showDisplayNameInPrivateMode
        ? profile.displayName
        : null,
    bio: !isPrivate || privacy?.showBioInPrivateMode ? profile.bio ?? null : null,
    gender: profile.gender ?? null,
    lookingFor: profile.lookingFor ?? null,
    city: !isPrivate || privacy?.showLocationInPrivateMode ? profile.city ?? null : null,
    country:
      !isPrivate || privacy?.showLocationInPrivateMode
        ? profile.country ?? null
        : null,
    photos: isPrivate ? [] : toPublicProfilePhotos(profile.photos ?? []),
  };
}

export function toCompactProfile(
  profile: ProfileSource,
  privacy?: ProfilePrivacySource | null,
): CompactProfileView {
  const publicProfile = toPublicProfile(profile, privacy);
  const primaryPhoto = publicProfile.photos.find((photo) => photo.isPrimary);

  return {
    userId: publicProfile.userId,
    handle: publicProfile.handle,
    displayName: publicProfile.displayName,
    primaryPhotoUrl: primaryPhoto?.publicUrl ?? null,
  };
}

export function toSelfProfile(profile: ProfileSource): SelfProfileView {
  return {
    userId: profile.userId,
    handle: profile.handle,
    displayName: profile.displayName,
    birthDate: profile.birthDate,
    bio: profile.bio ?? null,
    gender: profile.gender ?? null,
    lookingFor: profile.lookingFor ?? null,
    city: profile.city ?? null,
    country: profile.country ?? null,
    isDiscoverable: profile.isDiscoverable,
    completedAt: profile.completedAt,
    photos: [...(profile.photos ?? [])]
      .sort((left, right) => left.position - right.position)
      .map(toSelfProfilePhoto),
  };
}

export function toPublicProfilePhotos(
  photos: ProfilePhotoSource[],
): PublicProfilePhotoView[] {
  return photos
    .filter(
      (photo) =>
        photo.publicUrl &&
        photo.publishedAt &&
        photo.moderationStatus === PhotoModerationStatus.approved,
    )
    .sort((left, right) => left.position - right.position)
    .map((photo) => ({
      id: photo.id,
      publicUrl: photo.publicUrl as string,
      blurhash: photo.blurhash,
      isPrimary: photo.isPrimary,
      position: photo.position,
    }));
}

export function toSelfProfilePhoto(photo: ProfilePhotoSource): SelfProfilePhotoView {
  return {
    id: photo.id,
    publicUrl: photo.publicUrl,
    blurhash: photo.blurhash,
    isPrimary: photo.isPrimary,
    position: photo.position,
    moderationStatus: photo.moderationStatus,
    publishedAt: photo.publishedAt,
  };
}
