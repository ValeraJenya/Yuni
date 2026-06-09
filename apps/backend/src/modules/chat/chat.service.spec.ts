import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConversationStatus,
  MatchStatus,
  MessageStatus,
  PhotoModerationStatus,
  Prisma,
  ProfileVisibilityMode,
  UserStatus,
} from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { CursorPaginationQueryDto } from '../../common/pagination';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { ModerationService } from '../moderation/moderation.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

const CURRENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const THIRD_USER_ID = '33333333-3333-4333-8333-333333333333';
const CONVERSATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_CONVERSATION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MATCH_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const MESSAGE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const FIXED_NOW = new Date('2026-06-09T12:00:00.000Z');

const CURRENT_USER: AuthenticatedUser = {
  id: CURRENT_USER_ID,
  email: 'person@example.com',
};

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
  };
  conversation: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  message: {
    findMany: jest.Mock;
    create: jest.Mock;
  };
  match: {
    findUnique: jest.Mock;
  };
  $transaction: jest.Mock;
}

interface ModerationServiceMock {
  assertNoBlockBetween: jest.Mock;
}

interface NotificationsServiceMock {
  createMessageNotification: jest.Mock;
}

describe('ChatService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns only current user active unblocked conversations with safe list shape', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findMany.mockResolvedValue([
      makeConversation({
        messages: [
          makeMessage({
            body: 'Hello there',
            createdAt: new Date('2026-06-09T10:00:00.000Z'),
          }),
        ],
      }),
    ]);

    const result = await service.getConversations(CURRENT_USER, query());

    expect(prisma.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ConversationStatus.active,
          AND: expect.arrayContaining([
            {
              participants: {
                some: {
                  userId: CURRENT_USER_ID,
                  leftAt: null,
                },
              },
            },
            expect.objectContaining({
              participants: expect.objectContaining({
                none: expect.objectContaining({
                  userId: {
                    not: CURRENT_USER_ID,
                  },
                }),
              }),
            }),
          ]),
        }),
      }),
    );
    expect(result).toEqual({
      conversations: [
        {
          conversationId: CONVERSATION_ID,
          otherParticipant: {
            userId: OTHER_USER_ID,
            handle: 'other_user',
            displayName: 'Other User',
            primaryPhotoUrl: 'https://cdn.example.com/other.jpg',
          },
          lastMessage: {
            id: MESSAGE_ID,
            conversationId: CONVERSATION_ID,
            senderUserId: OTHER_USER_ID,
            text: 'Hello there',
            status: MessageStatus.sent,
            createdAt: new Date('2026-06-09T10:00:00.000Z'),
          },
          updatedAt: FIXED_NOW,
          status: ConversationStatus.active,
        },
      ],
      nextCursor: null,
    });
    expectNoForbiddenKeys(result);
  });

  it('hides blocked conversations in the list query', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findMany.mockResolvedValue([]);

    await service.getConversations(CURRENT_USER, query());

    const where = prisma.conversation.findMany.mock.calls[0][0].where;
    expect(where.AND[1]).toEqual({
      participants: {
        none: {
          userId: {
            not: CURRENT_USER_ID,
          },
          OR: [
            {
              user: {
                blockedUsers: {
                  some: {
                    blockedUserId: CURRENT_USER_ID,
                  },
                },
              },
            },
            {
              user: {
                blockedByUsers: {
                  some: {
                    blockerUserId: CURRENT_USER_ID,
                  },
                },
              },
            },
          ],
        },
      },
    });
  });

  it('supports conversation cursor pagination and clamps oversized limits', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findMany.mockResolvedValueOnce([
      makeConversation({ id: CONVERSATION_ID }),
      makeConversation({
        id: OTHER_CONVERSATION_ID,
        participants: [
          makeParticipant(CURRENT_USER_ID),
          makeParticipant(THIRD_USER_ID, {
            handle: 'third_user',
            displayName: 'Third User',
          }),
        ],
      }),
    ]);

    const firstPage = await service.getConversations(CURRENT_USER, {
      limit: 1,
    });

    expect(firstPage.conversations).toHaveLength(1);
    expect(firstPage.nextCursor).toBe(CONVERSATION_ID);
    expect(prisma.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
      }),
    );

    prisma.conversation.findMany.mockResolvedValueOnce([]);

    await service.getConversations(CURRENT_USER, {
      limit: 99,
      cursor: OTHER_CONVERSATION_ID,
    });

    expect(prisma.conversation.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cursor: {
          id: OTHER_CONVERSATION_ID,
        },
        skip: 1,
        take: 51,
      }),
    );
  });

  it('rejects inactive current users before list, send, and start lookups', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.disabled,
      deletedAt: null,
    });

    await expect(
      service.getConversations(CURRENT_USER, query()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.sendMessage(CURRENT_USER, CONVERSATION_ID, { text: 'hi' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.startConversationFromMatch(CURRENT_USER, MATCH_ID),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.conversation.findMany).not.toHaveBeenCalled();
    expect(prisma.conversation.findFirst).not.toHaveBeenCalled();
    expect(prisma.match.findUnique).not.toHaveBeenCalled();
  });

  it('does not read messages when the user is not an active participant', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findFirst.mockResolvedValue(null);

    await expect(
      service.getMessages(CURRENT_USER, CONVERSATION_ID, query()),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('uses not-found style for blocked message reads', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findFirst.mockResolvedValue(null);

    await expect(
      service.getMessages(CURRENT_USER, CONVERSATION_ID, query()),
    ).rejects.toBeInstanceOf(NotFoundException);

    const where = prisma.conversation.findFirst.mock.calls[0][0].where;
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participants: expect.objectContaining({
            none: expect.any(Object),
          }),
        }),
      ]),
    );
  });

  it('returns messages for only the selected conversation with safe shape and pagination', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findFirst.mockResolvedValue(makeConversation());
    prisma.message.findMany.mockResolvedValue([
      makeMessage({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        body: 'Newest',
        createdAt: new Date('2026-06-09T10:01:00.000Z'),
      }),
      makeMessage({
        id: MESSAGE_ID,
        body: 'Older',
        createdAt: new Date('2026-06-09T10:00:00.000Z'),
      }),
    ]);

    const result = await service.getMessages(CURRENT_USER, CONVERSATION_ID, {
      limit: 1,
    });

    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          conversationId: CONVERSATION_ID,
          status: MessageStatus.sent,
          deletedAt: null,
        },
        take: 2,
      }),
    );
    expect(result).toEqual({
      messages: [
        {
          id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          conversationId: CONVERSATION_ID,
          senderUserId: OTHER_USER_ID,
          text: 'Newest',
          status: MessageStatus.sent,
          createdAt: new Date('2026-06-09T10:01:00.000Z'),
        },
      ],
      nextCursor: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    });
    expectNoForbiddenKeys(result);
  });

  it('does not send when the user is not an active participant', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findFirst.mockResolvedValue(null);

    await expect(
      service.sendMessage(CURRENT_USER, CONVERSATION_ID, { text: 'hi' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('does not send in closed conversations', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findFirst.mockResolvedValue(
      makeConversation({
        status: ConversationStatus.closed,
      }),
    );

    await expect(
      service.sendMessage(CURRENT_USER, CONVERSATION_ID, { text: 'hi' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('blocks message sends when either participant has an active block', async () => {
    const { service, prisma, moderationService, notificationsService } =
      createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findFirst.mockResolvedValue(makeConversation());
    moderationService.assertNoBlockBetween.mockRejectedValue(
      new ForbiddenException('Forbidden'),
    );

    await expect(
      service.sendMessage(CURRENT_USER, CONVERSATION_ID, { text: 'hi' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(moderationService.assertNoBlockBetween).toHaveBeenCalledWith(
      CURRENT_USER_ID,
      OTHER_USER_ID,
    );
    expect(prisma.message.create).not.toHaveBeenCalled();
    expect(notificationsService.createMessageNotification).not.toHaveBeenCalled();
  });

  it('blocks new messages when the other participant is inactive or deleted', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findFirst.mockResolvedValue(
      makeConversation({
        participants: [
          makeParticipant(CURRENT_USER_ID),
          makeParticipant(OTHER_USER_ID, {
            status: UserStatus.disabled,
          }),
        ],
      }),
    );

    await expect(
      service.sendMessage(CURRENT_USER, CONVERSATION_ID, { text: 'hi' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('requires a second active participant for one-to-one MVP sends', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findFirst.mockResolvedValue(
      makeConversation({
        participants: [makeParticipant(CURRENT_USER_ID)],
      }),
    );

    await expect(
      service.sendMessage(CURRENT_USER, CONVERSATION_ID, { text: 'hi' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('trims and sends a plain-text message in a transaction', async () => {
    const { service, prisma, notificationsService } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.conversation.findFirst.mockResolvedValue(makeConversation());
    prisma.message.create.mockImplementation(async (args) =>
      makeMessage({
        body: args.data.body,
        senderUserId: args.data.senderUserId,
        createdAt: args.data.createdAt,
      }),
    );
    prisma.conversation.update.mockResolvedValue({ id: CONVERSATION_ID });

    const result = await service.sendMessage(CURRENT_USER, CONVERSATION_ID, {
      text: '  hello <b>world</b>  ',
    });

    expect(prisma.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: CONVERSATION_ID,
        senderUserId: CURRENT_USER_ID,
        body: 'hello <b>world</b>',
        status: MessageStatus.sent,
        createdAt: FIXED_NOW,
      },
      select: expect.any(Object),
    });
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: {
        id: CONVERSATION_ID,
      },
      data: {
        updatedAt: FIXED_NOW,
      },
      select: {
        id: true,
      },
    });
    expect(notificationsService.createMessageNotification).toHaveBeenCalledWith({
      recipientUserId: OTHER_USER_ID,
      actorUserId: CURRENT_USER_ID,
      conversationId: CONVERSATION_ID,
      messageId: MESSAGE_ID,
      now: FIXED_NOW,
    });
    expect(result).toEqual({
      message: {
        id: MESSAGE_ID,
        conversationId: CONVERSATION_ID,
        senderUserId: CURRENT_USER_ID,
        text: 'hello <b>world</b>',
        status: MessageStatus.sent,
        createdAt: FIXED_NOW,
      },
    });
    expectNoForbiddenKeys(result);
  });

  it('rejects whitespace-only message text at service level', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());

    await expect(
      service.sendMessage(CURRENT_USER, CONVERSATION_ID, { text: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.conversation.findFirst).not.toHaveBeenCalled();
  });

  it('validates message DTO trimming, non-empty text, and max length', async () => {
    const emptyDto = plainToInstance(CreateMessageDto, { text: '   ' });
    const tooLongDto = plainToInstance(CreateMessageDto, {
      text: 'a'.repeat(2001),
    });

    expect(emptyDto.text).toBe('');
    await expect(validate(emptyDto)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'text',
        }),
      ]),
    );
    await expect(validate(tooLongDto)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'text',
        }),
      ]),
    );
  });

  it('does not start a conversation for non-participants', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.match.findUnique.mockResolvedValue(
      makeMatch({
        userAId: OTHER_USER_ID,
        userBId: THIRD_USER_ID,
      }),
    );

    await expect(
      service.startConversationFromMatch(CURRENT_USER, MATCH_ID),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('creates a conversation and both participants for an active match', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.match.findUnique.mockResolvedValue(makeMatch());
    prisma.conversation.create.mockResolvedValue(makeConversation());

    const result = await service.startConversationFromMatch(CURRENT_USER, MATCH_ID);

    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: {
        matchId: MATCH_ID,
        status: ConversationStatus.active,
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
        participants: {
          create: [
            {
              userId: CURRENT_USER_ID,
              joinedAt: FIXED_NOW,
            },
            {
              userId: OTHER_USER_ID,
              joinedAt: FIXED_NOW,
            },
          ],
        },
      },
      select: expect.any(Object),
    });
    expect(result).toEqual({
      conversation: expect.objectContaining({
        conversationId: CONVERSATION_ID,
        otherParticipant: expect.objectContaining({
          userId: OTHER_USER_ID,
        }),
      }),
    });
  });

  it('returns an existing conversation idempotently even after the match expires', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.match.findUnique.mockResolvedValue(
      makeMatch({
        expiresAt: new Date('2026-06-08T12:00:00.000Z'),
        conversation: makeConversation(),
      }),
    );

    const result = await service.startConversationFromMatch(CURRENT_USER, MATCH_ID);

    expect(result.conversation.conversationId).toBe(CONVERSATION_ID);
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('does not start a conversation when the pair is blocked', async () => {
    const { service, prisma, moderationService } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.match.findUnique.mockResolvedValue(makeMatch());
    moderationService.assertNoBlockBetween.mockRejectedValue(
      new ForbiddenException('Forbidden'),
    );

    await expect(
      service.startConversationFromMatch(CURRENT_USER, MATCH_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('does not create a new conversation from an expired match', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.match.findUnique.mockResolvedValue(
      makeMatch({
        expiresAt: new Date('2026-06-08T12:00:00.000Z'),
      }),
    );

    await expect(
      service.startConversationFromMatch(CURRENT_USER, MATCH_ID),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('does not create a conversation when the other match participant is inactive', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.match.findUnique.mockResolvedValue(
      makeMatch({
        userB: {
          status: UserStatus.disabled,
          deletedAt: null,
        },
      }),
    );

    await expect(
      service.startConversationFromMatch(CURRENT_USER, MATCH_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('maps a race on unique match conversation to the existing conversation', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.match.findUnique.mockResolvedValue(makeMatch());
    prisma.conversation.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    prisma.conversation.findFirst.mockResolvedValue(makeConversation());

    const result = await service.startConversationFromMatch(CURRENT_USER, MATCH_ID);

    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: {
        matchId: MATCH_ID,
      },
      select: expect.any(Object),
    });
    expect(result.conversation.conversationId).toBe(CONVERSATION_ID);
  });
});

function createService() {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    conversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    match: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
  const moderationService: ModerationServiceMock = {
    assertNoBlockBetween: jest.fn().mockResolvedValue(undefined),
  };
  const notificationsService: NotificationsServiceMock = {
    createMessageNotification: jest.fn().mockResolvedValue(undefined),
  };

  return {
    service: new ChatService(
      prisma as unknown as PrismaService,
      moderationService as unknown as ModerationService,
      notificationsService as unknown as NotificationsService,
    ),
    prisma,
    moderationService,
    notificationsService,
  };
}

function query(
  overrides: Partial<CursorPaginationQueryDto> = {},
): CursorPaginationQueryDto {
  return overrides as CursorPaginationQueryDto;
}

function activeUser(): { status: UserStatus; deletedAt: Date | null } {
  return {
    status: UserStatus.active,
    deletedAt: null,
  };
}

function makeConversation(
  overrides: Partial<{
    id: string;
    status: ConversationStatus;
    updatedAt: Date;
    participants: ReturnType<typeof makeParticipant>[];
    messages: ReturnType<typeof makeMessage>[];
  }> = {},
) {
  return {
    id: overrides.id ?? CONVERSATION_ID,
    status: overrides.status ?? ConversationStatus.active,
    updatedAt: overrides.updatedAt ?? FIXED_NOW,
    participants:
      overrides.participants ?? [
        makeParticipant(CURRENT_USER_ID),
        makeParticipant(OTHER_USER_ID),
      ],
    messages: overrides.messages ?? [],
  };
}

function makeParticipant(
  userId: string,
  overrides: Partial<{
    leftAt: Date | null;
    status: UserStatus;
    deletedAt: Date | null;
    handle: string;
    displayName: string;
    photoUrl: string;
  }> = {},
) {
  const isOther = userId === OTHER_USER_ID;

  return {
    userId,
    leftAt: overrides.leftAt ?? null,
    user: {
      id: userId,
      status: overrides.status ?? UserStatus.active,
      deletedAt: overrides.deletedAt ?? null,
      privacySettings: {
        profileVisibilityMode: ProfileVisibilityMode.open,
        showDisplayNameInPrivateMode: false,
        showBioInPrivateMode: false,
        showLocationInPrivateMode: false,
      },
      profile: {
        userId,
        handle:
          overrides.handle ??
          (isOther ? 'other_user' : `user_${userId.slice(0, 8)}`),
        displayName:
          overrides.displayName ?? (isOther ? 'Other User' : 'Current User'),
        photos: [
          {
            id: `${userId.slice(0, 8)}-photo`,
            publicUrl:
              overrides.photoUrl ??
              (isOther
                ? 'https://cdn.example.com/other.jpg'
                : 'https://cdn.example.com/current.jpg'),
            blurhash: null,
            isPrimary: true,
            position: 0,
            moderationStatus: PhotoModerationStatus.approved,
            publishedAt: FIXED_NOW,
          },
        ],
      },
    },
  };
}

function makeMessage(
  overrides: Partial<{
    id: string;
    conversationId: string;
    senderUserId: string;
    body: string;
    status: MessageStatus;
    createdAt: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? MESSAGE_ID,
    conversationId: overrides.conversationId ?? CONVERSATION_ID,
    senderUserId: overrides.senderUserId ?? OTHER_USER_ID,
    body: overrides.body ?? 'Hello',
    status: overrides.status ?? MessageStatus.sent,
    createdAt: overrides.createdAt ?? FIXED_NOW,
  };
}

function makeMatch(
  overrides: Partial<{
    id: string;
    userAId: string;
    userBId: string;
    status: MatchStatus;
    expiresAt: Date;
    userA: ReturnType<typeof activeUser>;
    userB: ReturnType<typeof activeUser>;
    conversation: ReturnType<typeof makeConversation> | null;
  }> = {},
) {
  return {
    id: overrides.id ?? MATCH_ID,
    userAId: overrides.userAId ?? CURRENT_USER_ID,
    userBId: overrides.userBId ?? OTHER_USER_ID,
    status: overrides.status ?? MatchStatus.active,
    expiresAt: overrides.expiresAt ?? new Date('2026-06-16T12:00:00.000Z'),
    userA: overrides.userA ?? activeUser(),
    userB: overrides.userB ?? activeUser(),
    conversation: overrides.conversation ?? null,
  };
}

function expectNoForbiddenKeys(value: unknown): void {
  const keys = collectObjectKeys(value);
  const forbiddenKeys = [
    'body',
    'email',
    'birthDate',
    'password',
    'passwordHash',
    'refreshToken',
    'tokenHash',
    'storageKey',
    'localPath',
    'originalFilename',
    'privacySettings',
    'blockedUsers',
    'blockedByUsers',
    'lastReadMessageId',
    'deletedAt',
    'editedAt',
    'userAId',
    'userBId',
    'participants',
  ];

  for (const key of forbiddenKeys) {
    expect(keys).not.toContain(key);
  }
}

function collectObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object' || value instanceof Date) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectObjectKeys(item));
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => [
    key,
    ...collectObjectKeys(nestedValue),
  ]);
}
