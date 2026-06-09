import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  MatchStatus,
  PhotoModerationStatus,
  Prisma,
  ProfileVisibilityMode,
  UserStatus,
} from '@prisma/client';
import { buildCursorPage } from '../../common/pagination/cursor-pagination';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  DISCOVERY_DEFAULT_LIMIT,
  DISCOVERY_MAX_LIMIT,
} from './dto/discovery-cards-query.dto';

const discoveryProfileSelect = {
  userId: true,
  handle: true,
  displayName: true,
  birthDate: true,
  bio: true,
  gender: true,
  lookingFor: true,
  city: true,
  country: true,
  createdAt: true,
  photos: {
    where: {
      publicUrl: {
        not: null,
      },
      moderationStatus: PhotoModerationStatus.approved,
      publishedAt: {
        not: null,
      },
    },
    select: {
      publicUrl: true,
    },
    orderBy: [
      {
        isPrimary: 'desc',
      },
      {
        position: 'asc',
      },
    ],
  },
} satisfies Prisma.ProfileSelect;

type DiscoveryProfileRecord = Prisma.ProfileGetPayload<{
  select: typeof discoveryProfileSelect;
}>;

export interface DiscoveryCardPhoto {
  publicUrl: string;
}

export interface DiscoveryCard {
  userId: string;
  handle: string;
  displayName: string;
  bio: string | null;
  gender: string | null;
  lookingFor: string | null;
  city: string | null;
  country: string | null;
  age: number;
  primaryPhotoUrl: string | null;
  photos: DiscoveryCardPhoto[];
}

export interface DiscoveryCardsResponse {
  cards: DiscoveryCard[];
  nextCursor: string | null;
}

interface DiscoveryCardsQuery {
  cursor?: string;
  limit?: number;
}

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCards(
    currentUser: AuthenticatedUser,
    query: DiscoveryCardsQuery,
  ): Promise<DiscoveryCardsResponse> {
    await this.assertActiveUser(currentUser.id);

    const now = new Date();
    const pagination = this.normalizePagination(query);
    const profiles = await this.prisma.profile.findMany({
      where: this.buildDiscoveryWhere(currentUser.id, now),
      select: discoveryProfileSelect,
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          userId: 'desc',
        },
      ],
      ...(pagination.cursor
        ? {
            cursor: {
              userId: pagination.cursor,
            },
            skip: 1,
          }
        : {}),
      take: pagination.take,
    });
    const page = buildCursorPage(
      profiles,
      pagination.limit,
      (profile) => profile.userId,
    );

    return {
      cards: page.items.map((profile) => this.toDiscoveryCard(profile, now)),
      nextCursor: page.nextCursor,
    };
  }

  private async assertActiveUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.status !== UserStatus.active || user.deletedAt) {
      throw new UnauthorizedException('Authentication required');
    }
  }

  private buildDiscoveryWhere(
    currentUserId: string,
    now: Date,
  ): Prisma.ProfileWhereInput {
    return {
      userId: {
        not: currentUserId,
      },
      isDiscoverable: true,
      completedAt: {
        not: null,
      },
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
      user: {
        status: UserStatus.active,
        deletedAt: null,
        // PrivacySettings is optional, so discovery only shows explicitly open profiles.
        privacySettings: {
          is: {
            profileVisibilityMode: ProfileVisibilityMode.open,
            discoverable: true,
          },
        },
        blockedUsers: {
          none: {
            blockedUserId: currentUserId,
          },
        },
        blockedByUsers: {
          none: {
            blockerUserId: currentUserId,
          },
        },
        likesReceived: {
          none: {
            likerUserId: currentUserId,
            expiresAt: {
              gt: now,
            },
          },
        },
        matchesAsUserA: {
          none: {
            userBId: currentUserId,
            status: MatchStatus.active,
            expiresAt: {
              gt: now,
            },
          },
        },
        matchesAsUserB: {
          none: {
            userAId: currentUserId,
            status: MatchStatus.active,
            expiresAt: {
              gt: now,
            },
          },
        },
      },
    };
  }

  private normalizePagination(query: DiscoveryCardsQuery): {
    cursor?: string;
    limit: number;
    take: number;
  } {
    const limit = Math.min(
      Math.max(query.limit ?? DISCOVERY_DEFAULT_LIMIT, 1),
      DISCOVERY_MAX_LIMIT,
    );
    const cursor = query.cursor?.trim() || undefined;

    return {
      cursor,
      limit,
      take: limit + 1,
    };
  }

  private toDiscoveryCard(
    profile: DiscoveryProfileRecord,
    now: Date,
  ): DiscoveryCard {
    const photos = profile.photos
      .filter(
        (photo): photo is DiscoveryProfileRecord['photos'][number] & {
          publicUrl: string;
        } => Boolean(photo.publicUrl),
      )
      .map((photo) => ({
        publicUrl: photo.publicUrl,
      }));
    const primaryPhoto = photos[0];

    return {
      userId: profile.userId,
      handle: profile.handle,
      displayName: profile.displayName,
      bio: profile.bio,
      gender: profile.gender,
      lookingFor: profile.lookingFor,
      city: profile.city,
      country: profile.country,
      age: this.calculateAge(profile.birthDate, now),
      primaryPhotoUrl: primaryPhoto?.publicUrl ?? null,
      photos,
    };
  }

  private calculateAge(birthDate: Date, now: Date): number {
    let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const birthMonth = birthDate.getUTCMonth();
    const hasBirthdayPassed =
      currentMonth > birthMonth ||
      (currentMonth === birthMonth &&
        now.getUTCDate() >= birthDate.getUTCDate());

    if (!hasBirthdayPassed) {
      age -= 1;
    }

    return age;
  }
}
