import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PhotoModerationStatus, ProfileVisibilityMode } from '@prisma/client';
import {
  assertCanAccessPhoto,
  assertCanAccessProfile,
  assertFound,
  assertOwner,
} from './access-control';

describe('access-control helpers', () => {
  describe('assertFound', () => {
    it('allows existing resources', () => {
      expect(() => assertFound({ id: 'resource-1' })).not.toThrow();
    });

    it('hides missing resources behind a not found error', () => {
      expect(() => assertFound(null)).toThrow(NotFoundException);
      expect(() => assertFound(undefined)).toThrow(NotFoundException);
    });
  });

  describe('assertOwner', () => {
    it('allows the resource owner', () => {
      expect(() => assertOwner('user-1', 'user-1')).not.toThrow();
    });

    it('rejects non-owners', () => {
      expect(() => assertOwner('user-1', 'user-2')).toThrow(ForbiddenException);
    });
  });

  describe('assertCanAccessProfile', () => {
    it('allows owners regardless of discoverability or privacy', () => {
      expect(() =>
        assertCanAccessProfile(
          {
            userId: 'user-1',
            isDiscoverable: false,
            privacySettings: {
              profileVisibilityMode: ProfileVisibilityMode.private,
            },
          },
          'user-1',
        ),
      ).not.toThrow();
    });

    it('allows other users to access open discoverable profiles', () => {
      expect(() =>
        assertCanAccessProfile(
          {
            userId: 'user-2',
            isDiscoverable: true,
            privacySettings: {
              profileVisibilityMode: ProfileVisibilityMode.open,
            },
          },
          'user-1',
        ),
      ).not.toThrow();
    });

    it('rejects other users when a profile is private or non-discoverable', () => {
      expect(() =>
        assertCanAccessProfile(
          {
            userId: 'user-2',
            isDiscoverable: true,
            privacySettings: {
              profileVisibilityMode: ProfileVisibilityMode.private,
            },
          },
          'user-1',
        ),
      ).toThrow(ForbiddenException);

      expect(() =>
        assertCanAccessProfile(
          {
            userId: 'user-2',
            isDiscoverable: false,
            privacySettings: {
              profileVisibilityMode: ProfileVisibilityMode.open,
            },
          },
          'user-1',
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('assertCanAccessPhoto', () => {
    it('allows owners to access their own photos', () => {
      expect(() =>
        assertCanAccessPhoto(
          {
            userId: 'user-1',
            moderationStatus: PhotoModerationStatus.pending,
            publishedAt: null,
          },
          'user-1',
        ),
      ).not.toThrow();
    });

    it('allows other users to access approved published photos', () => {
      expect(() =>
        assertCanAccessPhoto(
          {
            userId: 'user-2',
            moderationStatus: PhotoModerationStatus.approved,
            publishedAt: new Date('2026-06-01T00:00:00.000Z'),
          },
          'user-1',
        ),
      ).not.toThrow();
    });

    it('rejects other users when photos are not approved and published', () => {
      expect(() =>
        assertCanAccessPhoto(
          {
            userId: 'user-2',
            moderationStatus: PhotoModerationStatus.pending,
            publishedAt: new Date('2026-06-01T00:00:00.000Z'),
          },
          'user-1',
        ),
      ).toThrow(ForbiddenException);

      expect(() =>
        assertCanAccessPhoto(
          {
            userId: 'user-2',
            moderationStatus: PhotoModerationStatus.approved,
            publishedAt: null,
          },
          'user-1',
        ),
      ).toThrow(ForbiddenException);
    });
  });
});
