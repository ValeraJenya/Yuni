import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConversationStatus,
  MatchStatus,
  Prisma,
  ReportReasonCode,
  UserStatus,
} from '@prisma/client';
import {
  buildCursorPage,
  CursorPaginationQueryDto,
  normalizeCursorPagination,
} from '../../common/pagination';
import { PrismaService } from '../../common/prisma/prisma.service';
import { lockUserPair } from '../../common/prisma/user-pair-lock';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateReportDto } from './dto/create-report.dto';

const TARGET_USER_NOT_FOUND_MESSAGE = 'User not found';
const BLOCKED_INTERACTION_MESSAGE = 'Forbidden';

type ModerationTransactionClient = Prisma.TransactionClient | PrismaService;

export interface BlockResponse {
  block: {
    blockedUserId: string;
    createdAt: Date;
    status: 'blocked';
  };
}

export interface UnblockResponse {
  success: true;
  blockedUserId: string;
}

export interface BlocksListResponse {
  blocks: BlockResponse['block'][];
  nextCursor: string | null;
}

export interface ReportResponse {
  report: {
    id: string;
    targetUserId: string;
    reason: ReportReasonCode;
    createdAt: Date;
    status: 'received';
  };
}

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async blockUser(
    currentUser: AuthenticatedUser,
    targetUserId: string,
  ): Promise<BlockResponse> {
    const now = new Date();

    if (targetUserId === currentUser.id) {
      throw new BadRequestException('Cannot block yourself');
    }

    await this.assertActiveUser(currentUser.id);
    await this.assertActiveTargetUser(targetUserId);

    try {
      const block = await this.prisma.$transaction(async (tx) => {
        // Task 042: лок берётся первым действием транзакции, до любого чтения,
        // чтобы конкурирующее создание match не проскочило между проверкой и
        // записью. Проверка существующего блока тоже должна быть под локом —
        // иначе idempotent-ветка снова читает устаревший снимок.
        await lockUserPair(tx, currentUser.id, targetUserId);

        const existingBlock = await this.findBlock(
          currentUser.id,
          targetUserId,
          tx,
        );

        if (existingBlock) {
          await this.endActiveMatchesBetween(
            currentUser.id,
            targetUserId,
            now,
            tx,
          );

          return existingBlock;
        }

        const createdBlock = await tx.block.create({
          data: {
            blockerUserId: currentUser.id,
            blockedUserId: targetUserId,
            createdAt: now,
          },
          select: {
            blockedUserId: true,
            createdAt: true,
          },
        });

        await this.endActiveMatchesBetween(currentUser.id, targetUserId, now, tx);

        return createdBlock;
      });

      return this.toBlockResponse(block);
    } catch (error) {
      if (!this.isDuplicateBlockError(error)) {
        throw error;
      }

      const block = await this.findBlock(currentUser.id, targetUserId);
      await this.endActiveMatchesBetween(currentUser.id, targetUserId, now);

      return this.toBlockResponse(
        block ?? {
          blockedUserId: targetUserId,
          createdAt: now,
        },
      );
    }
  }

  async unblockUser(
    currentUser: AuthenticatedUser,
    targetUserId: string,
  ): Promise<UnblockResponse> {
    await this.assertActiveUser(currentUser.id);

    await this.prisma.block.deleteMany({
      where: {
        blockerUserId: currentUser.id,
        blockedUserId: targetUserId,
      },
    });

    return {
      success: true,
      blockedUserId: targetUserId,
    };
  }

  async getMyBlocks(
    currentUser: AuthenticatedUser,
    query: CursorPaginationQueryDto,
  ): Promise<BlocksListResponse> {
    await this.assertActiveUser(currentUser.id);
    const pagination = normalizeCursorPagination(query);

    const blocks = await this.prisma.block.findMany({
      where: {
        blockerUserId: currentUser.id,
      },
      select: {
        id: true,
        blockedUserId: true,
        createdAt: true,
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      ...(pagination.cursor
        ? {
            cursor: {
              id: pagination.cursor,
            },
            skip: 1,
          }
        : {}),
      take: pagination.take,
    });
    const page = buildCursorPage(blocks, pagination.limit, (block) => block.id);

    return {
      blocks: page.items.map((block) =>
        this.toBlockResponse({
          blockedUserId: block.blockedUserId,
          createdAt: block.createdAt,
        }).block,
      ),
      nextCursor: page.nextCursor,
    };
  }

  async reportUser(
    currentUser: AuthenticatedUser,
    dto: CreateReportDto,
  ): Promise<ReportResponse> {
    if (dto.targetUserId === currentUser.id) {
      throw new BadRequestException('Cannot report yourself');
    }

    await this.assertActiveUser(currentUser.id);
    await this.assertActiveTargetUser(dto.targetUserId);

    const report = await this.prisma.report.create({
      data: {
        reporterUserId: currentUser.id,
        reportedUserId: dto.targetUserId,
        reasonCode: dto.reason,
        comment: dto.details ?? null,
      },
      select: {
        id: true,
        reportedUserId: true,
        reasonCode: true,
        createdAt: true,
      },
    });

    return {
      report: {
        id: report.id,
        targetUserId: report.reportedUserId,
        reason: report.reasonCode,
        createdAt: report.createdAt,
        status: 'received',
      },
    };
  }

  async hasBlockBetween(
    leftUserId: string,
    rightUserId: string,
    client: ModerationTransactionClient = this.prisma,
  ): Promise<boolean> {
    if (leftUserId === rightUserId) {
      return false;
    }

    const block = await client.block.findFirst({
      where: this.blockBetweenWhere(leftUserId, rightUserId),
      select: {
        id: true,
      },
    });

    return Boolean(block);
  }

  async assertNoBlockBetween(
    leftUserId: string,
    rightUserId: string,
    client: ModerationTransactionClient = this.prisma,
  ): Promise<void> {
    if (await this.hasBlockBetween(leftUserId, rightUserId, client)) {
      throw new ForbiddenException(BLOCKED_INTERACTION_MESSAGE);
    }
  }

  async getBlockedUserIdsFor(
    currentUserId: string,
    targetUserIds: string[],
  ): Promise<Set<string>> {
    if (targetUserIds.length === 0) {
      return new Set();
    }

    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [
          {
            blockerUserId: currentUserId,
            blockedUserId: {
              in: targetUserIds,
            },
          },
          {
            blockedUserId: currentUserId,
            blockerUserId: {
              in: targetUserIds,
            },
          },
        ],
      },
      select: {
        blockerUserId: true,
        blockedUserId: true,
      },
    });

    return new Set(
      blocks.map((block) =>
        block.blockerUserId === currentUserId
          ? block.blockedUserId
          : block.blockerUserId,
      ),
    );
  }

  async endActiveMatchesBetween(
    leftUserId: string,
    rightUserId: string,
    now = new Date(),
    client: ModerationTransactionClient = this.prisma,
  ): Promise<void> {
    if (leftUserId === rightUserId) {
      return;
    }

    await client.match.updateMany({
      where: {
        status: MatchStatus.active,
        expiresAt: {
          gt: now,
        },
        OR: [
          {
            userAId: leftUserId,
            userBId: rightUserId,
          },
          {
            userAId: rightUserId,
            userBId: leftUserId,
          },
        ],
      },
      data: {
        status: MatchStatus.blocked,
        endedAt: now,
      },
    });

    // Closing the match alone leaves the underlying Conversation reachable:
    // findWritableConversationOrThrow only rejects non-active conversations,
    // and unblockUser only ever deletes the Block row, so without this the
    // old conversation would keep accepting messages, and would look fully
    // "restored" (with no explicit reopening) as soon as the block is lifted.
    // Closing it here, in the same transaction as the match, makes both
    // effects of a block atomic and — matching Match, which never reverts
    // from `blocked` on unblock — permanent.
    await client.conversation.updateMany({
      where: {
        status: ConversationStatus.active,
        match: {
          OR: [
            {
              userAId: leftUserId,
              userBId: rightUserId,
            },
            {
              userAId: rightUserId,
              userBId: leftUserId,
            },
          ],
        },
      },
      data: {
        status: ConversationStatus.closed,
      },
    });
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

  private async assertActiveTargetUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.status !== UserStatus.active || user.deletedAt) {
      throw new NotFoundException(TARGET_USER_NOT_FOUND_MESSAGE);
    }
  }

  private findBlock(
    blockerUserId: string,
    blockedUserId: string,
    client: ModerationTransactionClient = this.prisma,
  ) {
    return client.block.findUnique({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId,
          blockedUserId,
        },
      },
      select: {
        blockedUserId: true,
        createdAt: true,
      },
    });
  }

  private toBlockResponse(block: {
    blockedUserId: string;
    createdAt: Date;
  }): BlockResponse {
    return {
      block: {
        blockedUserId: block.blockedUserId,
        createdAt: block.createdAt,
        status: 'blocked',
      },
    };
  }

  private blockBetweenWhere(leftUserId: string, rightUserId: string) {
    return {
      OR: [
        {
          blockerUserId: leftUserId,
          blockedUserId: rightUserId,
        },
        {
          blockerUserId: rightUserId,
          blockedUserId: leftUserId,
        },
      ],
    } satisfies Prisma.BlockWhereInput;
  }

  private isDuplicateBlockError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
