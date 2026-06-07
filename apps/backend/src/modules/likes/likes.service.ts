import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LikeKind, Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { assertCanAccessProfile } from '../../common/security/access-control';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  MatchesService,
  type MatchResponse,
} from '../matches/matches.service';
import { ModerationService } from '../moderation/moderation.service';

const LIKE_COOLDOWN_DAYS = 3;
const SKIP_COOLDOWN_DAYS = 1;
const ACTIVE_INTERACTION_CONFLICT_MESSAGE = 'Active interaction already exists';
const PROFILE_NOT_FOUND_MESSAGE = 'Profile not found';

type InteractionAction = 'like' | 'skip';

export interface LikeInteractionResponse {
  interaction: {
    targetProfileUserId: string;
    action: InteractionAction;
    expiresAt: Date;
  };
  match?: MatchResponse;
}

const targetProfileSelect = {
  userId: true,
  isDiscoverable: true,
  user: {
    select: {
      status: true,
      deletedAt: true,
      privacySettings: {
        select: {
          profileVisibilityMode: true,
        },
      },
    },
  },
} satisfies Prisma.ProfileSelect;

type TargetProfileRecord = Prisma.ProfileGetPayload<{
  select: typeof targetProfileSelect;
}>;

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchesService: MatchesService,
    private readonly moderationService: ModerationService,
  ) {}

  likeProfile(
    currentUser: AuthenticatedUser,
    targetProfileUserId: string,
  ): Promise<LikeInteractionResponse> {
    return this.createInteraction(
      currentUser,
      targetProfileUserId,
      LikeKind.like,
      LIKE_COOLDOWN_DAYS,
    );
  }

  skipProfile(
    currentUser: AuthenticatedUser,
    targetProfileUserId: string,
  ): Promise<LikeInteractionResponse> {
    return this.createInteraction(
      currentUser,
      targetProfileUserId,
      LikeKind.pass,
      SKIP_COOLDOWN_DAYS,
    );
  }

  private async createInteraction(
    currentUser: AuthenticatedUser,
    targetProfileUserId: string,
    kind: LikeKind,
    cooldownDays: number,
  ): Promise<LikeInteractionResponse> {
    const now = new Date();

    if (targetProfileUserId === currentUser.id) {
      throw new BadRequestException('Cannot interact with your own profile');
    }

    await this.assertActiveUser(currentUser.id);
    const targetProfile = await this.findAccessibleTargetProfile(
      targetProfileUserId,
      currentUser.id,
    );
    await this.moderationService.assertNoBlockBetween(
      currentUser.id,
      targetProfile.userId,
    );

    const activeInteraction = await this.prisma.like.findFirst({
      where: {
        likerUserId: currentUser.id,
        likedUserId: targetProfile.userId,
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (activeInteraction) {
      throw this.activeInteractionConflict();
    }

    const expiresAt = this.getExpiryDate(now, cooldownDays);

    try {
      const interaction = await this.prisma.like.create({
        data: {
          likerUserId: currentUser.id,
          likedUserId: targetProfile.userId,
          kind,
          createdAt: now,
          expiresAt,
        },
        select: {
          likedUserId: true,
          kind: true,
          expiresAt: true,
        },
      });
      const match =
        kind === LikeKind.like
          ? await this.matchesService.tryCreateMatchFromLike({
              actorUserId: currentUser.id,
              targetUserId: targetProfile.userId,
              now,
            })
          : null;

      return this.toInteractionResponse(interaction, match);
    } catch (error) {
      if (this.isActiveInteractionConstraintError(error)) {
        throw this.activeInteractionConflict();
      }

      throw error;
    }
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

  private async findAccessibleTargetProfile(
    targetProfileUserId: string,
    currentUserId: string,
  ): Promise<TargetProfileRecord> {
    const targetProfile = await this.prisma.profile.findUnique({
      where: { userId: targetProfileUserId },
      select: targetProfileSelect,
    });

    if (
      !targetProfile ||
      targetProfile.user.status !== UserStatus.active ||
      targetProfile.user.deletedAt
    ) {
      throw new NotFoundException(PROFILE_NOT_FOUND_MESSAGE);
    }

    assertCanAccessProfile(
      {
        userId: targetProfile.userId,
        isDiscoverable: targetProfile.isDiscoverable,
        privacySettings: targetProfile.user.privacySettings,
      },
      currentUserId,
    );

    return targetProfile;
  }

  private getExpiryDate(now: Date, cooldownDays: number): Date {
    return new Date(now.getTime() + cooldownDays * 24 * 60 * 60 * 1000);
  }

  private toInteractionResponse(interaction: {
    likedUserId: string;
    kind: LikeKind;
    expiresAt: Date;
  }, match?: MatchResponse | null): LikeInteractionResponse {
    const response: LikeInteractionResponse = {
      interaction: {
        targetProfileUserId: interaction.likedUserId,
        action: interaction.kind === LikeKind.pass ? 'skip' : 'like',
        expiresAt: interaction.expiresAt,
      },
    };

    if (match) {
      response.match = match;
    }

    return response;
  }

  private activeInteractionConflict(): ConflictException {
    return new ConflictException(ACTIVE_INTERACTION_CONFLICT_MESSAGE);
  }

  private isActiveInteractionConstraintError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    if (error.code === 'P2002') {
      return true;
    }

    if (error.code !== 'P2004') {
      return false;
    }

    const metadata = JSON.stringify(error.meta ?? {});
    return (
      metadata.includes('likes_no_overlapping_active_interactions') ||
      error.message.includes('likes_no_overlapping_active_interactions')
    );
  }
}
