import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PhotoModerationStatus, ProfileVisibilityMode } from '@prisma/client';

const RESOURCE_NOT_FOUND_MESSAGE = 'Resource not found';
const FORBIDDEN_MESSAGE = 'Forbidden';

export interface OwnedResource {
  userId: string;
}

export interface MatchParticipantResource {
  userAId: string;
  userBId: string;
}

export interface ConversationMembershipResource {
  userId: string;
  leftAt?: Date | null;
}

export interface ProfileAccessResource extends OwnedResource {
  isDiscoverable?: boolean;
  privacySettings?: {
    profileVisibilityMode: ProfileVisibilityMode;
    discoverable?: boolean;
  } | null;
}

export interface PhotoAccessResource extends OwnedResource {
  moderationStatus: PhotoModerationStatus;
  publishedAt?: Date | null;
}

export function assertFound<T>(
  resource: T | null | undefined,
): asserts resource is T {
  if (!resource) {
    throw new NotFoundException(RESOURCE_NOT_FOUND_MESSAGE);
  }
}

export function assertOwner(
  resourceOwnerId: string,
  currentUserId: string,
): void {
  if (resourceOwnerId !== currentUserId) {
    throw new ForbiddenException(FORBIDDEN_MESSAGE);
  }
}

export function assertSameUser(
  targetUserId: string,
  currentUserId: string,
): void {
  assertOwner(targetUserId, currentUserId);
}

export function assertConversationMember(
  membership: ConversationMembershipResource | null | undefined,
  currentUserId: string,
): asserts membership is ConversationMembershipResource {
  if (!membership || membership.userId !== currentUserId || membership.leftAt) {
    throw new ForbiddenException(FORBIDDEN_MESSAGE);
  }
}

export function assertMatchParticipant(
  match: MatchParticipantResource | null | undefined,
  currentUserId: string,
): asserts match is MatchParticipantResource {
  assertFound(match);

  if (match.userAId !== currentUserId && match.userBId !== currentUserId) {
    throw new ForbiddenException(FORBIDDEN_MESSAGE);
  }
}

export function assertCanAccessProfile(
  profile: ProfileAccessResource | null | undefined,
  currentUserId: string,
): asserts profile is ProfileAccessResource {
  assertFound(profile);

  if (profile.userId === currentUserId) {
    return;
  }

  const visibilityMode = profile.privacySettings?.profileVisibilityMode ?? ProfileVisibilityMode.open;
  // Profile.isDiscoverable and PrivacySettings.discoverable are separate flags with
  // separate toggles in the UI, so either one being off must hide the profile.
  // Missing privacy settings fall back to the schema default (true): the row is created
  // together with the user, so null only shows up as broken data, never as an opt-out.
  const privacyDiscoverable = profile.privacySettings?.discoverable ?? true;

  if (
    !profile.isDiscoverable ||
    !privacyDiscoverable ||
    visibilityMode !== ProfileVisibilityMode.open
  ) {
    throw new ForbiddenException(FORBIDDEN_MESSAGE);
  }
}

export function assertCanAccessPhoto(
  photo: PhotoAccessResource | null | undefined,
  currentUserId: string,
): asserts photo is PhotoAccessResource {
  assertFound(photo);

  if (photo.userId === currentUserId) {
    return;
  }

  if (
    photo.moderationStatus !== PhotoModerationStatus.approved ||
    !photo.publishedAt
  ) {
    throw new ForbiddenException(FORBIDDEN_MESSAGE);
  }
}
