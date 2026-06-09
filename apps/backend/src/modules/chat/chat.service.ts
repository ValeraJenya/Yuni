import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConversationStatus,
  MatchStatus,
  MessageStatus,
  PhotoModerationStatus,
  Prisma,
  UserStatus,
} from '@prisma/client';
import {
  buildCursorPage,
  CursorPaginationQueryDto,
  normalizeCursorPagination,
} from '../../common/pagination';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  toCompactProfile,
  type CompactProfileView,
} from '../../common/serializers/user-profile.serializer';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ModerationService } from '../moderation/moderation.service';
import { CreateMessageDto } from './dto/create-message.dto';

const RESOURCE_NOT_FOUND_MESSAGE = 'Resource not found';
const MESSAGE_TEXT_REQUIRED_MESSAGE = 'Message text is required';
const INACTIVE_MATCH_MESSAGE = 'Match is not active';
const SECOND_PARTICIPANT_REQUIRED_MESSAGE = 'Conversation is not available';

const chatProfileSelect = {
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

const chatUserSelect = {
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
    select: chatProfileSelect,
  },
} satisfies Prisma.UserSelect;

const chatParticipantSelect = {
  userId: true,
  leftAt: true,
  user: {
    select: chatUserSelect,
  },
} satisfies Prisma.ConversationParticipantSelect;

const chatMessageSelect = {
  id: true,
  conversationId: true,
  senderUserId: true,
  body: true,
  status: true,
  createdAt: true,
} satisfies Prisma.MessageSelect;

const conversationSummarySelect = {
  id: true,
  status: true,
  updatedAt: true,
  participants: {
    where: {
      leftAt: null,
    },
    select: chatParticipantSelect,
  },
  messages: {
    where: {
      status: MessageStatus.sent,
      deletedAt: null,
    },
    select: chatMessageSelect,
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],
    take: 1,
  },
} satisfies Prisma.ConversationSelect;

const matchConversationSelect = {
  id: true,
  userAId: true,
  userBId: true,
  status: true,
  expiresAt: true,
  userA: {
    select: {
      status: true,
      deletedAt: true,
    },
  },
  userB: {
    select: {
      status: true,
      deletedAt: true,
    },
  },
  conversation: {
    select: conversationSummarySelect,
  },
} satisfies Prisma.MatchSelect;

type ConversationSummaryRecord = Prisma.ConversationGetPayload<{
  select: typeof conversationSummarySelect;
}>;

type ChatMessageRecord = Prisma.MessageGetPayload<{
  select: typeof chatMessageSelect;
}>;

type MatchConversationRecord = Prisma.MatchGetPayload<{
  select: typeof matchConversationSelect;
}>;

export interface ChatMessageView {
  id: string;
  conversationId: string;
  senderUserId: string;
  text: string;
  status: MessageStatus;
  createdAt: Date;
}

export interface ConversationSummary {
  conversationId: string;
  otherParticipant: CompactProfileView;
  lastMessage: ChatMessageView | null;
  updatedAt: Date;
  status: ConversationStatus;
}

export interface ConversationsListResponse {
  conversations: ConversationSummary[];
  nextCursor: string | null;
}

export interface MessagesListResponse {
  messages: ChatMessageView[];
  nextCursor: string | null;
}

export interface SendMessageResponse {
  message: ChatMessageView;
}

export interface StartConversationResponse {
  conversation: ConversationSummary;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderationService: ModerationService,
  ) {}

  async getConversations(
    currentUser: AuthenticatedUser,
    query: CursorPaginationQueryDto,
  ): Promise<ConversationsListResponse> {
    await this.assertActiveUser(currentUser.id);
    const pagination = normalizeCursorPagination(query);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        status: ConversationStatus.active,
        AND: [
          this.activeParticipantWhere(currentUser.id),
          this.unblockedConversationWhere(currentUser.id),
        ],
      },
      select: conversationSummarySelect,
      orderBy: [
        {
          updatedAt: 'desc',
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
    const page = buildCursorPage(
      conversations,
      pagination.limit,
      (conversation) => conversation.id,
    );

    return {
      conversations: page.items.map((conversation) =>
        this.toConversationSummaryOrThrow(conversation, currentUser.id),
      ),
      nextCursor: page.nextCursor,
    };
  }

  async getMessages(
    currentUser: AuthenticatedUser,
    conversationId: string,
    query: CursorPaginationQueryDto,
  ): Promise<MessagesListResponse> {
    await this.assertActiveUser(currentUser.id);
    const pagination = normalizeCursorPagination(query);

    await this.findReadableConversationOrThrow(currentUser.id, conversationId);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        status: MessageStatus.sent,
        deletedAt: null,
      },
      select: chatMessageSelect,
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
    const page = buildCursorPage(messages, pagination.limit, (message) => message.id);

    return {
      messages: page.items.reverse().map((message) => this.toMessageView(message)),
      nextCursor: page.nextCursor,
    };
  }

  async sendMessage(
    currentUser: AuthenticatedUser,
    conversationId: string,
    dto: CreateMessageDto,
  ): Promise<SendMessageResponse> {
    await this.assertActiveUser(currentUser.id);
    const text = dto.text.trim();

    if (!text) {
      throw new BadRequestException(MESSAGE_TEXT_REQUIRED_MESSAGE);
    }

    const conversation = await this.findWritableConversationOrThrow(
      currentUser.id,
      conversationId,
    );
    const otherParticipant = this.getOtherActiveParticipant(
      conversation,
      currentUser.id,
    );

    if (!otherParticipant) {
      throw new ForbiddenException(SECOND_PARTICIPANT_REQUIRED_MESSAGE);
    }

    if (
      otherParticipant.user.status !== UserStatus.active ||
      otherParticipant.user.deletedAt
    ) {
      throw new ForbiddenException(SECOND_PARTICIPANT_REQUIRED_MESSAGE);
    }

    await this.moderationService.assertNoBlockBetween(
      currentUser.id,
      otherParticipant.userId,
    );

    const now = new Date();
    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          conversationId,
          senderUserId: currentUser.id,
          body: text,
          status: MessageStatus.sent,
          createdAt: now,
        },
        select: chatMessageSelect,
      });

      await tx.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: now,
        },
        select: {
          id: true,
        },
      });

      return createdMessage;
    });

    return {
      message: this.toMessageView(message),
    };
  }

  async startConversationFromMatch(
    currentUser: AuthenticatedUser,
    matchId: string,
  ): Promise<StartConversationResponse> {
    await this.assertActiveUser(currentUser.id);

    const match = await this.prisma.match.findUnique({
      where: {
        id: matchId,
      },
      select: matchConversationSelect,
    });

    if (!match || !this.isMatchParticipant(match, currentUser.id)) {
      throw new NotFoundException(RESOURCE_NOT_FOUND_MESSAGE);
    }

    const otherUserId = this.getMatchedUserId(match, currentUser.id);
    await this.moderationService.assertNoBlockBetween(currentUser.id, otherUserId);

    if (match.conversation) {
      return {
        conversation: this.toConversationSummaryOrThrow(
          match.conversation,
          currentUser.id,
        ),
      };
    }

    const now = new Date();

    if (match.status !== MatchStatus.active || match.expiresAt <= now) {
      throw new ConflictException(INACTIVE_MATCH_MESSAGE);
    }

    if (!this.isActiveMatchUser(match, otherUserId)) {
      throw new ForbiddenException(SECOND_PARTICIPANT_REQUIRED_MESSAGE);
    }

    try {
      const conversation = await this.prisma.$transaction(async (tx) =>
        tx.conversation.create({
          data: {
            matchId: match.id,
            status: ConversationStatus.active,
            createdAt: now,
            updatedAt: now,
            participants: {
              create: [
                {
                  userId: match.userAId,
                  joinedAt: now,
                },
                {
                  userId: match.userBId,
                  joinedAt: now,
                },
              ],
            },
          },
          select: conversationSummarySelect,
        }),
      );

      return {
        conversation: this.toConversationSummaryOrThrow(
          conversation,
          currentUser.id,
        ),
      };
    } catch (error) {
      if (!this.isDuplicateConversationForMatchError(error)) {
        throw error;
      }

      const existingConversation = await this.findConversationByMatchOrThrow(
        match.id,
      );

      return {
        conversation: this.toConversationSummaryOrThrow(
          existingConversation,
          currentUser.id,
        ),
      };
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

  private findReadableConversationOrThrow(
    currentUserId: string,
    conversationId: string,
  ): Promise<ConversationSummaryRecord> {
    return this.findConversationForRead(currentUserId, conversationId).then(
      (conversation) => {
        if (!conversation) {
          throw new NotFoundException(RESOURCE_NOT_FOUND_MESSAGE);
        }

        return conversation;
      },
    );
  }

  private async findWritableConversationOrThrow(
    currentUserId: string,
    conversationId: string,
  ): Promise<ConversationSummaryRecord> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        AND: [this.activeParticipantWhere(currentUserId)],
      },
      select: conversationSummarySelect,
    });

    if (!conversation) {
      throw new NotFoundException(RESOURCE_NOT_FOUND_MESSAGE);
    }

    if (conversation.status !== ConversationStatus.active) {
      throw new ForbiddenException('Forbidden');
    }

    return conversation;
  }

  private findConversationForRead(
    currentUserId: string,
    conversationId: string,
  ): Promise<ConversationSummaryRecord | null> {
    return this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        AND: [
          this.activeParticipantWhere(currentUserId),
          this.unblockedConversationWhere(currentUserId),
        ],
      },
      select: conversationSummarySelect,
    });
  }

  private findConversationByMatchOrThrow(
    matchId: string,
  ): Promise<ConversationSummaryRecord> {
    return this.prisma.conversation
      .findFirst({
        where: {
          matchId,
        },
        select: conversationSummarySelect,
      })
      .then((conversation) => {
        if (!conversation) {
          throw new ConflictException(INACTIVE_MATCH_MESSAGE);
        }

        return conversation;
      });
  }

  private activeParticipantWhere(userId: string): Prisma.ConversationWhereInput {
    return {
      participants: {
        some: {
          userId,
          leftAt: null,
        },
      },
    };
  }

  private unblockedConversationWhere(
    currentUserId: string,
  ): Prisma.ConversationWhereInput {
    return {
      participants: {
        none: {
          userId: {
            not: currentUserId,
          },
          OR: [
            {
              user: {
                blockedUsers: {
                  some: {
                    blockedUserId: currentUserId,
                  },
                },
              },
            },
            {
              user: {
                blockedByUsers: {
                  some: {
                    blockerUserId: currentUserId,
                  },
                },
              },
            },
          ],
        },
      },
    };
  }

  private isMatchParticipant(
    match: MatchConversationRecord,
    currentUserId: string,
  ): boolean {
    return match.userAId === currentUserId || match.userBId === currentUserId;
  }

  private getMatchedUserId(
    match: MatchConversationRecord,
    currentUserId: string,
  ): string {
    return match.userAId === currentUserId ? match.userBId : match.userAId;
  }

  private isActiveMatchUser(
    match: MatchConversationRecord,
    userId: string,
  ): boolean {
    const user = match.userAId === userId ? match.userA : match.userB;

    return user.status === UserStatus.active && !user.deletedAt;
  }

  private getOtherActiveParticipant(
    conversation: ConversationSummaryRecord,
    currentUserId: string,
  ): ConversationSummaryRecord['participants'][number] | null {
    return (
      conversation.participants.find(
        (participant) =>
          participant.userId !== currentUserId && participant.leftAt === null,
      ) ?? null
    );
  }

  private toConversationSummaryOrThrow(
    conversation: ConversationSummaryRecord,
    currentUserId: string,
  ): ConversationSummary {
    const otherParticipant = this.getOtherActiveParticipant(
      conversation,
      currentUserId,
    );

    if (!otherParticipant?.user.profile) {
      throw new NotFoundException(RESOURCE_NOT_FOUND_MESSAGE);
    }

    return {
      conversationId: conversation.id,
      otherParticipant: toCompactProfile(
        otherParticipant.user.profile,
        otherParticipant.user.privacySettings,
      ),
      lastMessage: conversation.messages[0]
        ? this.toMessageView(conversation.messages[0])
        : null,
      updatedAt: conversation.updatedAt,
      status: conversation.status,
    };
  }

  private toMessageView(message: ChatMessageRecord): ChatMessageView {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderUserId: message.senderUserId,
      text: message.body,
      status: message.status,
      createdAt: message.createdAt,
    };
  }

  private isDuplicateConversationForMatchError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
