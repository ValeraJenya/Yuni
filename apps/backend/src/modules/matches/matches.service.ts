import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LikeKind,
  MatchStatus,
  PhotoModerationStatus,
  Prisma,
  UserStatus,
} from '@prisma/client';
import {
  toCompactProfile,
  type CompactProfileView,
} from '../../common/serializers/user-profile.serializer';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ModerationService } from '../moderation/moderation.service';

const MATCH_DURATION_DAYS = 7;
const ACTIVE_MATCH_CONFLICT_MESSAGE = 'Active match already exists';

const matchProfileSelect = {
  userId: true,
  handle: true,
  displayName: true,
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
      id: true,
      publicUrl: true,
      blurhash: true,
      isPrimary: true,
      position: true,
      moderationStatus: true,
      publishedAt: true,
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

const matchUserSelect = {
  id: true,
  status: true,
  deletedAt: true,
  privacySettings: {
    select: {
      profileVisibilityMode: true,
      showDisplayNameInPrivateMode: true,
      showBioInPrivateMode: true,
      showLocationInPrivateMode: true,
    },
  },
  profile: {
    select: matchProfileSelect,
  },
} satisfies Prisma.UserSelect;

const matchResponseSelect = {
  id: true,
  userAId: true,
  userBId: true,
  status: true,
  matchedAt: true,
  expiresAt: true,
  conversation: {
    select: {
      id: true,
    },
  },
  userA: {
    select: matchUserSelect,
  },
  userB: {
    select: matchUserSelect,
  },
} satisfies Prisma.MatchSelect;

type MatchRecord = Prisma.MatchGetPayload<{
  select: typeof matchResponseSelect;
}>;

export interface MatchResponse {
  id: string;
  matchedProfile: CompactProfileView;
  matchedAt: Date;
  expiresAt: Date;
  status: MatchStatus;
  conversationId: string | null;
  conversationStarted: boolean;
}

export interface MatchesListResponse {
  matches: MatchResponse[];
}

export interface TryCreateMatchFromLikeInput {
  actorUserId: string;
  targetUserId: string;
  now?: Date;
}

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderationService: ModerationService,
  ) {}

  async getMyMatches(
    currentUser: AuthenticatedUser,
  ): Promise<MatchesListResponse> {
    await this.assertActiveUser(currentUser.id);

    const now = new Date();
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.active,
        expiresAt: {
          gt: now,
        },
        OR: [
          {
            userAId: currentUser.id,
          },
          {
            userBId: currentUser.id,
          },
        ],
      },
      select: matchResponseSelect,
      orderBy: {
        matchedAt: 'desc',
      },
    });

    const participantMatches = matches.filter((match) =>
      this.isMatchParticipant(match, currentUser.id),
    );
    const blockedUserIds = await this.moderationService.getBlockedUserIdsFor(
      currentUser.id,
      participantMatches.map((match) =>
        this.getMatchedUserId(match, currentUser.id),
      ),
    );

    return {
      matches: participantMatches
        .filter(
          (match) =>
            !blockedUserIds.has(this.getMatchedUserId(match, currentUser.id)),
        )
        .map((match) => this.toMatchResponse(match, currentUser.id))
        .filter((match): match is MatchResponse => Boolean(match)),
    };
  }

  async tryCreateMatchFromLike({
    actorUserId,
    targetUserId,
    now = new Date(),
  }: TryCreateMatchFromLikeInput): Promise<MatchResponse | null> {
    const pair = this.normalizePair(actorUserId, targetUserId);

    if (await this.moderationService.hasBlockBetween(actorUserId, targetUserId)) {
      return null;
    }

    const reciprocalLike = await this.prisma.like.findFirst({
      where: {
        likerUserId: targetUserId,
        likedUserId: actorUserId,
        kind: LikeKind.like,
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (!reciprocalLike) {
      return null;
    }

    const activeMatch = await this.findActiveMatchByPair(pair, now);

    if (activeMatch) {
      return this.toMatchResponse(activeMatch, actorUserId);
    }

    try {
      const match = await this.prisma.match.create({
        data: {
          userAId: pair.userAId,
          userBId: pair.userBId,
          status: MatchStatus.active,
          matchedAt: now,
          expiresAt: this.getExpiryDate(now),
        },
        select: matchResponseSelect,
      });

      return this.toMatchResponse(match, actorUserId);
    } catch (error) {
      if (!this.isActiveMatchConstraintError(error)) {
        throw error;
      }

      const existingMatch = await this.findActiveMatchByPair(pair, now);

      if (existingMatch) {
        return this.toMatchResponse(existingMatch, actorUserId);
      }

      throw new ConflictException(ACTIVE_MATCH_CONFLICT_MESSAGE);
    }
  }

  normalizePair(leftUserId: string, rightUserId: string): {
    userAId: string;
    userBId: string;
  } {
    if (leftUserId === rightUserId) {
      throw new BadRequestException('Cannot create a match with yourself');
    }

    return leftUserId < rightUserId
      ? { userAId: leftUserId, userBId: rightUserId }
      : { userAId: rightUserId, userBId: leftUserId };
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

  private findActiveMatchByPair(
    pair: {
      userAId: string;
      userBId: string;
    },
    now: Date,
  ): Promise<MatchRecord | null> {
    return this.prisma.match.findFirst({
      where: {
        userAId: pair.userAId,
        userBId: pair.userBId,
        status: MatchStatus.active,
        expiresAt: {
          gt: now,
        },
      },
      select: matchResponseSelect,
    });
  }

  private getExpiryDate(now: Date): Date {
    return new Date(now.getTime() + MATCH_DURATION_DAYS * 24 * 60 * 60 * 1000);
  }

  private isMatchParticipant(match: MatchRecord, currentUserId: string): boolean {
    return match.userAId === currentUserId || match.userBId === currentUserId;
  }

  private getMatchedUserId(match: MatchRecord, currentUserId: string): string {
    return match.userAId === currentUserId ? match.userBId : match.userAId;
  }

  private toMatchResponse(
    match: MatchRecord,
    currentUserId: string,
  ): MatchResponse | null {
    const matchedUser =
      match.userAId === currentUserId ? match.userB : match.userA;

    if (
      matchedUser.status !== UserStatus.active ||
      matchedUser.deletedAt ||
      !matchedUser.profile
    ) {
      return null;
    }

    return {
      id: match.id,
      matchedAt: match.matchedAt,
      expiresAt: match.expiresAt,
      status: match.status,
      conversationId: match.conversation?.id ?? null,
      conversationStarted: Boolean(match.conversation),
      matchedProfile: toCompactProfile(
        matchedUser.profile,
        matchedUser.privacySettings,
      ),
    };
  }

  private isActiveMatchConstraintError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    if (error.code !== 'P2004') {
      return false;
    }

    const metadata = JSON.stringify(error.meta ?? {});
    return (
      metadata.includes('matches_no_overlapping_active_pairs') ||
      error.message.includes('matches_no_overlapping_active_pairs')
    );
  }
}
