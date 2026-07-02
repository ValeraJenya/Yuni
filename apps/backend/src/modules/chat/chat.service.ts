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
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMessageDto } from './dto/create-message.dto';

const RESOURCE_NOT_FOUND_MESSAGE = 'Resource not found';
const MESSAGE_TEXT_REQUIRED_MESSAGE = 'Message text is required';
const INACTIVE_MATCH_MESSAGE = 'Match is not active';
const SECOND_PARTICIPANT_REQUIRED_MESSAGE = 'Conversation is not available';
const VOICE_NOT_AVAILABLE_MESSAGE = 'Voice messages are not available at this stage';
const ATTACHMENT_NOT_AVAILABLE_MESSAGE =
  'Attachments are not available at this stage';
const VOICE_DURATION_REQUIRED_MESSAGE = 'Voice duration is required';
const VOICE_LIMIT_EXCEEDED_MESSAGE = 'Voice limit exceeded';
const GAME_NOT_AVAILABLE_MESSAGE = 'Game is not available';
const GAME_POSTPONE_LIMIT_MESSAGE = 'Game postpone limit exceeded';
const DUPLICATE_GAME_ANSWER_MESSAGE = 'Game answer already exists';
const STAGE_1_TO_2_MESSAGE =
  '🎉 Вы хорошо познакомились! Теперь доступны голосовые сообщения';
const STAGE_2_TO_3_MESSAGE =
  '🎊 Отличное общение! Теперь все возможности открыты';

const STAGE_2_GAME_COMPLETION_TARGET = 3;
const STAGE_2_VOICE_TOTAL_LIMIT_SEC = 90;
const STAGE_2_VOICE_MESSAGE_LIMIT_SEC = 60;
const GAME_POSTPONE_MS = 60 * 1000;
const GAME_TYPE_QUESTION = 'question';
const GAME_THRESHOLDS_BY_STAGE: Record<number, number[]> = {
  1: [5, 10],
  2: [5, 10, 15],
};
const GAME_QUESTIONS = [
  'Что у тебя обычно моментально поднимает настроение?',
  'Какой маленький ритуал делает твой день лучше?',
  'О каком месте ты чаще всего вспоминаешь с улыбкой?',
  'Что тебе интереснее: спонтанный план или продуманный маршрут?',
  'Какой комплимент тебе запомнился надолго?',
  'Что ты любишь делать, когда хочется перезагрузиться?',
  'Какая тема разговора легко увлекает тебя на час?',
  'Какой навык ты бы с удовольствием освоил(а)?',
  'Что для тебя хороший знак в первом разговоре?',
  'Какая еда почти всегда звучит как хорошая идея?',
  'Что ты ценишь в людях сильнее всего?',
  'Какой вечер для тебя почти идеальный?',
];

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
  joinedAt: true,
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
  voiceDurationSec: true,
  messageWeight: true,
  isSystemMessage: true,
  status: true,
  createdAt: true,
} satisfies Prisma.MessageSelect;

const conversationSummarySelect = {
  id: true,
  status: true,
  updatedAt: true,
  stage: true,
  stage1StartedAt: true,
  stage2StartedAt: true,
  stage3StartedAt: true,
  stageUpdatedAt: true,
  user1VoiceTotalSec: true,
  user2VoiceTotalSec: true,
  match: {
    select: {
      userAId: true,
      userBId: true,
    },
  },
  participants: {
    where: {
      leftAt: null,
    },
    select: chatParticipantSelect,
    orderBy: [
      {
        joinedAt: 'asc',
      },
      {
        userId: 'asc',
      },
    ],
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

const chatGameSelect = {
  id: true,
  conversationId: true,
  stage: true,
  gameType: true,
  question: true,
  options: true,
  shownAt: true,
  completedAt: true,
  postponedUntil: true,
  postponeCount: true,
} satisfies Prisma.ChatGameSelect;

const chatGameWithAnswersSelect = {
  ...chatGameSelect,
  answers: {
    select: {
      userId: true,
    },
  },
} satisfies Prisma.ChatGameSelect;

type ConversationSummaryRecord = Prisma.ConversationGetPayload<{
  select: typeof conversationSummarySelect;
}>;

type ChatMessageRecord = Prisma.MessageGetPayload<{
  select: typeof chatMessageSelect;
}>;

type MatchConversationRecord = Prisma.MatchGetPayload<{
  select: typeof matchConversationSelect;
}>;

type ChatGameRecord = Prisma.ChatGameGetPayload<{
  select: typeof chatGameSelect;
}>;

export interface ChatMessageView {
  id: string;
  conversationId: string;
  senderUserId: string | null;
  text: string;
  voiceDurationSec?: number;
  messageWeight?: number;
  isSystemMessage: boolean;
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

export interface ConversationStageResponse {
  stage: number;
  stageStartedAt: Date | null;
  stageUpdatedAt: Date | null;
  voiceLimits: {
    maxRecordTimeSec: number | null;
    currentUserTotalSec: number;
    totalLimitSec: number | null;
    perMessageLimitSec: number | null;
  };
}

export interface ConversationStarterView {
  id: string;
  text: string;
}

export interface CurrentGameView {
  id: string;
  conversationId: string;
  stage: number;
  gameType: string;
  question: string;
  options: Prisma.JsonValue | null;
  shownAt: Date;
  completedAt: Date | null;
  postponedUntil: Date | null;
  postponeCount: number;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderationService: ModerationService,
    private readonly notificationsService: NotificationsService,
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

  async getConversationStage(
    currentUser: AuthenticatedUser,
    conversationId: string,
  ): Promise<ConversationStageResponse> {
    await this.assertActiveUser(currentUser.id);
    const conversation = await this.findReadableConversationOrThrow(
      currentUser.id,
      conversationId,
    );
    const currentUserVoiceTotal = this.getVoiceTotalForUser(
      conversation,
      currentUser.id,
    );

    return {
      stage: conversation.stage,
      stageStartedAt: this.getStageStartedAt(conversation),
      stageUpdatedAt: conversation.stageUpdatedAt,
      voiceLimits: {
        maxRecordTimeSec:
          conversation.stage === 2
            ? Math.max(
                0,
                Math.min(
                  STAGE_2_VOICE_MESSAGE_LIMIT_SEC,
                  STAGE_2_VOICE_TOTAL_LIMIT_SEC - currentUserVoiceTotal,
                ),
              )
            : null,
        currentUserTotalSec: currentUserVoiceTotal,
        totalLimitSec:
          conversation.stage === 2 ? STAGE_2_VOICE_TOTAL_LIMIT_SEC : null,
        perMessageLimitSec:
          conversation.stage === 2 ? STAGE_2_VOICE_MESSAGE_LIMIT_SEC : null,
      },
    };
  }

  async getStarters(): Promise<{ starters: ConversationStarterView[] }> {
    const starters = await this.prisma.conversationStarter.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        text: true,
      },
      orderBy: {
        text: 'asc',
      },
      take: 4,
    });

    return { starters };
  }

  async getCurrentGame(
    currentUser: AuthenticatedUser,
    conversationId: string,
  ): Promise<{ game: CurrentGameView | null }> {
    await this.assertActiveUser(currentUser.id);
    await this.findReadableConversationOrThrow(currentUser.id, conversationId);

    return {
      game: await this.findCurrentGame(conversationId, new Date()),
    };
  }

  async postponeCurrentGame(
    currentUser: AuthenticatedUser,
    conversationId: string,
  ): Promise<{ game: CurrentGameView }> {
    await this.assertActiveUser(currentUser.id);
    await this.findWritableConversationOrThrow(currentUser.id, conversationId);

    const now = new Date();
    const game = await this.findCurrentGame(conversationId, now);

    if (!game) {
      throw new NotFoundException(GAME_NOT_AVAILABLE_MESSAGE);
    }

    if (game.postponeCount >= 1) {
      throw new ForbiddenException(GAME_POSTPONE_LIMIT_MESSAGE);
    }

    const postponedUntil = new Date(now.getTime() + GAME_POSTPONE_MS);
    const updated = await this.prisma.chatGame.update({
      where: {
        id: game.id,
      },
      data: {
        postponedUntil,
        postponeCount: {
          increment: 1,
        },
      },
      select: chatGameSelect,
    });

    return {
      game: this.toCurrentGameView(updated),
    };
  }

  async answerGame(
    currentUser: AuthenticatedUser,
    conversationId: string,
    gameId: string,
    answer: string,
  ): Promise<{ game: CurrentGameView }> {
    await this.assertActiveUser(currentUser.id);
    const conversation = await this.findWritableConversationOrThrow(
      currentUser.id,
      conversationId,
    );
    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      throw new BadRequestException('Game answer is required');
    }

    const now = new Date();
    const game = await this.prisma.chatGame.findFirst({
      where: {
        id: gameId,
        conversationId,
        completedAt: null,
      },
      select: chatGameWithAnswersSelect,
    });

    if (
      !game ||
      (game.postponedUntil !== null && game.postponedUntil > now)
    ) {
      throw new NotFoundException(GAME_NOT_AVAILABLE_MESSAGE);
    }

    if (game.answers.some((gameAnswer) => gameAnswer.userId === currentUser.id)) {
      throw new ConflictException(DUPLICATE_GAME_ANSWER_MESSAGE);
    }

    const updatedGame = await this.prisma.$transaction(async (tx) => {
      await tx.gameAnswer.create({
        data: {
          gameId,
          userId: currentUser.id,
          answer: trimmedAnswer,
          answeredAt: now,
        },
        select: {
          id: true,
        },
      });

      const answerCount = await tx.gameAnswer.count({
        where: {
          gameId,
        },
      });

      if (answerCount >= 2) {
        await tx.chatGame.update({
          where: {
            id: gameId,
          },
          data: {
            completedAt: now,
          },
          select: {
            id: true,
          },
        });

        await this.advanceStageIfReady(
          tx,
          conversation,
          game.stage,
          now,
        );
      }

      return tx.chatGame.findUniqueOrThrow({
        where: {
          id: gameId,
        },
        select: chatGameSelect,
      });
    });

    return {
      game: this.toCurrentGameView(updatedGame),
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
    const messageType = dto.messageType ?? 'text';
    const voiceDurationSec = this.resolveVoiceDurationSec(
      conversation,
      currentUser.id,
      messageType,
      dto.voiceDurationSec,
    );
    const messageWeight = this.getMessageWeight(messageType, voiceDurationSec);
    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          conversationId,
          senderUserId: currentUser.id,
          body: text,
          voiceDurationSec,
          messageWeight,
          isSystemMessage: false,
          status: MessageStatus.sent,
          createdAt: now,
        },
        select: chatMessageSelect,
      });

      const voiceTotalUpdate = this.getVoiceTotalUpdate(
        conversation,
        currentUser.id,
        voiceDurationSec,
      );

      await tx.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: now,
          ...voiceTotalUpdate,
        },
        select: {
          id: true,
        },
      });

      await this.createGameIfNeeded(tx, conversation, now);

      return createdMessage;
    });

    await this.notificationsService.createMessageNotification({
      recipientUserId: otherParticipant.userId,
      actorUserId: currentUser.id,
      conversationId,
      messageId: message.id,
      now,
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
            stage: 1,
            stage1StartedAt: now,
            stageUpdatedAt: now,
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

  private resolveVoiceDurationSec(
    conversation: ConversationSummaryRecord,
    currentUserId: string,
    messageType: string,
    requestedDurationSec: number | undefined,
  ): number | null {
    if (messageType === 'attachment' && conversation.stage < 3) {
      throw new ForbiddenException(ATTACHMENT_NOT_AVAILABLE_MESSAGE);
    }

    if (messageType !== 'voice') {
      return null;
    }

    if (conversation.stage === 1) {
      throw new ForbiddenException(VOICE_NOT_AVAILABLE_MESSAGE);
    }

    if (!requestedDurationSec) {
      throw new BadRequestException(VOICE_DURATION_REQUIRED_MESSAGE);
    }

    if (conversation.stage >= 3) {
      return requestedDurationSec;
    }

    const currentTotal = this.getVoiceTotalForUser(conversation, currentUserId);
    const remaining = STAGE_2_VOICE_TOTAL_LIMIT_SEC - currentTotal;

    if (remaining <= 0) {
      throw new ForbiddenException(VOICE_LIMIT_EXCEEDED_MESSAGE);
    }

    return Math.min(
      requestedDurationSec,
      STAGE_2_VOICE_MESSAGE_LIMIT_SEC,
      remaining,
    );
  }

  private getMessageWeight(
    messageType: string,
    voiceDurationSec: number | null,
  ): number {
    if (messageType !== 'voice' || voiceDurationSec === null) {
      return 1;
    }

    return Math.max(1, Math.floor(voiceDurationSec / 15));
  }

  private getVoiceTotalUpdate(
    conversation: ConversationSummaryRecord,
    currentUserId: string,
    voiceDurationSec: number | null,
  ): Prisma.ConversationUpdateInput {
    if (conversation.stage !== 2 || voiceDurationSec === null) {
      return {};
    }

    return this.isFirstVoiceParticipant(conversation, currentUserId)
      ? {
          user1VoiceTotalSec: {
            increment: voiceDurationSec,
          },
        }
      : {
          user2VoiceTotalSec: {
            increment: voiceDurationSec,
          },
        };
  }

  private getVoiceTotalForUser(
    conversation: ConversationSummaryRecord,
    currentUserId: string,
  ): number {
    return this.isFirstVoiceParticipant(conversation, currentUserId)
      ? conversation.user1VoiceTotalSec
      : conversation.user2VoiceTotalSec;
  }

  private isFirstVoiceParticipant(
    conversation: ConversationSummaryRecord,
    currentUserId: string,
  ): boolean {
    return conversation.match?.userAId === currentUserId;
  }

  private getStageStartedAt(
    conversation: ConversationSummaryRecord,
  ): Date | null {
    if (conversation.stage === 1) {
      return conversation.stage1StartedAt;
    }

    if (conversation.stage === 2) {
      return conversation.stage2StartedAt;
    }

    return conversation.stage3StartedAt;
  }

  private async findCurrentGame(
    conversationId: string,
    now: Date,
  ): Promise<CurrentGameView | null> {
    const game = await this.prisma.chatGame.findFirst({
      where: {
        conversationId,
        completedAt: null,
        OR: [
          {
            postponedUntil: null,
          },
          {
            postponedUntil: {
              lte: now,
            },
          },
        ],
      },
      select: chatGameSelect,
      orderBy: {
        shownAt: 'asc',
      },
    });

    return game ? this.toCurrentGameView(game) : null;
  }

  private async createGameIfNeeded(
    tx: Prisma.TransactionClient,
    conversation: ConversationSummaryRecord,
    now: Date,
  ): Promise<void> {
    const thresholds = GAME_THRESHOLDS_BY_STAGE[conversation.stage] ?? [];

    if (thresholds.length === 0) {
      return;
    }

    const activeGame = await tx.chatGame.findFirst({
      where: {
        conversationId: conversation.id,
        completedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (activeGame) {
      return;
    }

    const existingGames = await tx.chatGame.findMany({
      where: {
        conversationId: conversation.id,
        stage: conversation.stage,
      },
      select: {
        question: true,
      },
    });
    const nextThreshold = thresholds[existingGames.length];

    if (!nextThreshold) {
      return;
    }

    const stageStartedAt = this.getStageStartedAt(conversation);
    const messageWeight = await tx.message.aggregate({
      where: {
        conversationId: conversation.id,
        status: MessageStatus.sent,
        deletedAt: null,
        ...(stageStartedAt
          ? {
              createdAt: {
                gte: stageStartedAt,
              },
            }
          : {}),
      },
      _sum: {
        messageWeight: true,
      },
    });

    if ((messageWeight._sum.messageWeight ?? 0) < nextThreshold) {
      return;
    }

    const usedQuestions = new Set(existingGames.map((game) => game.question));
    const question = GAME_QUESTIONS.find(
      (candidate) => !usedQuestions.has(candidate),
    );

    if (!question) {
      return;
    }

    await tx.chatGame.create({
      data: {
        conversationId: conversation.id,
        stage: conversation.stage,
        gameType: GAME_TYPE_QUESTION,
        question,
        shownAt: now,
      },
      select: {
        id: true,
      },
    });
  }

  private async advanceStageIfReady(
    tx: Prisma.TransactionClient,
    conversation: ConversationSummaryRecord,
    completedGameStage: number,
    now: Date,
  ): Promise<void> {
    if (conversation.stage !== completedGameStage || conversation.stage >= 3) {
      return;
    }

    const completedGames = await tx.chatGame.count({
      where: {
        conversationId: conversation.id,
        stage: conversation.stage,
        completedAt: {
          not: null,
        },
      },
    });
    const shouldAdvance =
      (conversation.stage === 1 && completedGames >= 2) ||
      (conversation.stage === 2 &&
        completedGames >= STAGE_2_GAME_COMPLETION_TARGET);

    if (!shouldAdvance) {
      return;
    }

    const nextStage = conversation.stage + 1;
    await tx.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        stage: nextStage,
        stageUpdatedAt: now,
        updatedAt: now,
        ...(nextStage === 2
          ? {
              stage2StartedAt: now,
              user1VoiceTotalSec: 0,
              user2VoiceTotalSec: 0,
            }
          : {
              stage3StartedAt: now,
            }),
      },
      select: {
        id: true,
      },
    });

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderUserId: null,
        body: nextStage === 2 ? STAGE_1_TO_2_MESSAGE : STAGE_2_TO_3_MESSAGE,
        isSystemMessage: true,
        status: MessageStatus.sent,
        messageWeight: 1,
        createdAt: now,
      },
      select: {
        id: true,
      },
    });
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
    const view: ChatMessageView = {
      id: message.id,
      conversationId: message.conversationId,
      senderUserId: message.senderUserId,
      text: message.body,
      isSystemMessage: message.isSystemMessage,
      status: message.status,
      createdAt: message.createdAt,
    };

    if (message.voiceDurationSec !== null) {
      view.voiceDurationSec = message.voiceDurationSec;
      view.messageWeight = message.messageWeight;
    }

    return view;
  }

  private toCurrentGameView(game: ChatGameRecord): CurrentGameView {
    return {
      id: game.id,
      conversationId: game.conversationId,
      stage: game.stage,
      gameType: game.gameType,
      question: game.question,
      options: game.options,
      shownAt: game.shownAt,
      completedAt: game.completedAt,
      postponedUntil: game.postponedUntil,
      postponeCount: game.postponeCount,
    };
  }

  private isDuplicateConversationForMatchError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
