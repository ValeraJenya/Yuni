import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  NotificationType,
  PhotoModerationStatus,
  ProfileVisibilityMode,
  UserStatus,
} from '@prisma/client';
import type { CursorPaginationQueryDto } from '../../common/pagination';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { ModerationService } from '../moderation/moderation.service';
import { NOTIFICATION_MESSAGE_KEYS } from './notifications.constants';
import { NotificationsService } from './notifications.service';

const CURRENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_USER_ID = '22222222-2222-4222-8222-222222222222';
const THIRD_USER_ID = '33333333-3333-4333-8333-333333333333';
const MATCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONVERSATION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MESSAGE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const NOTIFICATION_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SECOND_NOTIFICATION_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const FIXED_NOW = new Date('2026-06-10T12:00:00.000Z');

const CURRENT_USER: AuthenticatedUser = {
  id: CURRENT_USER_ID,
  email: 'person@example.com',
};

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
  };
  notification: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
}

interface ModerationServiceMock {
  hasBlockBetween: jest.Mock;
}

describe('NotificationsService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates match notifications for both recipients without storing message body or snapshots', async () => {
    const { service, prisma } = createService();

    await service.createMatchNotifications({
      matchId: MATCH_ID,
      userAId: CURRENT_USER_ID,
      userBId: ACTOR_USER_ID,
      now: FIXED_NOW,
    });

    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
    expect(prisma.notification.create).toHaveBeenNthCalledWith(1, {
      data: {
        recipientUserId: CURRENT_USER_ID,
        actorUserId: ACTOR_USER_ID,
        type: NotificationType.match_created,
        messageKey: NOTIFICATION_MESSAGE_KEYS.matchCreated,
        matchId: MATCH_ID,
        conversationId: undefined,
        messageId: undefined,
        createdAt: FIXED_NOW,
      },
      select: {
        id: true,
      },
    });
    expect(prisma.notification.create).toHaveBeenNthCalledWith(2, {
      data: {
        recipientUserId: ACTOR_USER_ID,
        actorUserId: CURRENT_USER_ID,
        type: NotificationType.match_created,
        messageKey: NOTIFICATION_MESSAGE_KEYS.matchCreated,
        matchId: MATCH_ID,
        conversationId: undefined,
        messageId: undefined,
        createdAt: FIXED_NOW,
      },
      select: {
        id: true,
      },
    });
    expectNoForbiddenKeys(prisma.notification.create.mock.calls);
  });

  it('creates message notification for the recipient only', async () => {
    const { service, prisma } = createService();

    await service.createMessageNotification({
      recipientUserId: ACTOR_USER_ID,
      actorUserId: CURRENT_USER_ID,
      conversationId: CONVERSATION_ID,
      messageId: MESSAGE_ID,
      now: FIXED_NOW,
    });

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        recipientUserId: ACTOR_USER_ID,
        actorUserId: CURRENT_USER_ID,
        type: NotificationType.message_received,
        messageKey: NOTIFICATION_MESSAGE_KEYS.messageReceived,
        matchId: undefined,
        conversationId: CONVERSATION_ID,
        messageId: MESSAGE_ID,
        createdAt: FIXED_NOW,
      },
      select: {
        id: true,
      },
    });
    expectNoForbiddenKeys(prisma.notification.create.mock.calls);
  });

  it('does not create self-notifications', async () => {
    const { service, prisma, moderationService } = createService();

    await service.createMessageNotification({
      recipientUserId: CURRENT_USER_ID,
      actorUserId: CURRENT_USER_ID,
      conversationId: CONVERSATION_ID,
      messageId: MESSAGE_ID,
    });

    expect(moderationService.hasBlockBetween).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('does not create notifications when users are blocked in either direction', async () => {
    const { service, prisma, moderationService } = createService();
    moderationService.hasBlockBetween.mockResolvedValue(true);

    await service.createMessageNotification({
      recipientUserId: ACTOR_USER_ID,
      actorUserId: CURRENT_USER_ID,
      conversationId: CONVERSATION_ID,
      messageId: MESSAGE_ID,
    });

    expect(moderationService.hasBlockBetween).toHaveBeenCalledWith(
      ACTOR_USER_ID,
      CURRENT_USER_ID,
    );
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('respects NotificationSettings for matches and messages', async () => {
    const { service, prisma } = createService({
      user: activeUser({
        notificationSettings: {
          matchesEnabled: false,
          messagesEnabled: false,
        },
      }),
    });

    await service.createMatchNotifications({
      matchId: MATCH_ID,
      userAId: CURRENT_USER_ID,
      userBId: ACTOR_USER_ID,
    });
    await service.createMessageNotification({
      recipientUserId: ACTOR_USER_ID,
      actorUserId: CURRENT_USER_ID,
      conversationId: CONVERSATION_ID,
      messageId: MESSAGE_ID,
    });

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('lists only current user visible notifications with safe shape', async () => {
    const { service, prisma } = createService();
    prisma.notification.findMany.mockResolvedValue([
      makeNotification({ id: NOTIFICATION_ID }),
    ]);

    const result = await service.listMyNotifications(CURRENT_USER, query());

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recipientUserId: CURRENT_USER_ID,
        }),
        select: expect.any(Object),
      }),
    );
    expect(result).toEqual({
      notifications: [
        {
          id: NOTIFICATION_ID,
          type: NotificationType.message_received,
          messageKey: NOTIFICATION_MESSAGE_KEYS.messageReceived,
          createdAt: FIXED_NOW,
          readAt: null,
          actor: {
            userId: ACTOR_USER_ID,
            handle: 'actor_user',
            displayName: 'Actor User',
            primaryPhotoUrl: 'https://cdn.example.com/actor.jpg',
          },
          matchId: null,
          conversationId: CONVERSATION_ID,
          messageId: MESSAGE_ID,
        },
      ],
      nextCursor: null,
    });
    expectNoForbiddenKeys(result);
  });

  it('hides blocked actor and unsafe actorless match/message notifications through visible filters and serializer', async () => {
    const { service, prisma } = createService();
    prisma.notification.findMany.mockResolvedValue([
      makeNotification({
        actor: null,
        actorUserId: null,
      }),
      makeNotification({
        id: SECOND_NOTIFICATION_ID,
        type: NotificationType.system,
        actor: null,
        actorUserId: null,
        messageKey: NOTIFICATION_MESSAGE_KEYS.system,
        conversationId: null,
        messageId: null,
      }),
    ]);

    const result = await service.listMyNotifications(CURRENT_USER, query());
    const where = prisma.notification.findMany.mock.calls[0][0].where;

    expect(where.OR).toEqual(
      expect.arrayContaining([
        {
          type: NotificationType.system,
        },
        expect.objectContaining({
          actor: expect.objectContaining({
            is: expect.objectContaining({
              blockedUsers: {
                none: {
                  blockedUserId: CURRENT_USER_ID,
                },
              },
              blockedByUsers: {
                none: {
                  blockerUserId: CURRENT_USER_ID,
                },
              },
            }),
          }),
        }),
      ]),
    );
    expect(result.notifications).toEqual([
      expect.objectContaining({
        id: SECOND_NOTIFICATION_ID,
        type: NotificationType.system,
        actor: null,
      }),
    ]);
  });

  it('counts unread notifications for only current user visible notifications', async () => {
    const { service, prisma } = createService();
    prisma.notification.count.mockResolvedValue(3);

    await expect(service.getUnreadCount(CURRENT_USER)).resolves.toEqual({
      unreadCount: 3,
    });
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        recipientUserId: CURRENT_USER_ID,
        readAt: null,
      }),
    });
  });

  it('marks one own visible notification as read', async () => {
    const { service, prisma } = createService();
    prisma.notification.findFirst.mockResolvedValue(
      makeNotification({ id: NOTIFICATION_ID }),
    );
    prisma.notification.update.mockResolvedValue(
      makeNotification({
        id: NOTIFICATION_ID,
        readAt: FIXED_NOW,
      }),
    );

    const result = await service.markOneRead(CURRENT_USER, NOTIFICATION_ID);

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: NOTIFICATION_ID,
        recipientUserId: CURRENT_USER_ID,
      }),
      select: expect.any(Object),
    });
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: {
        id: NOTIFICATION_ID,
      },
      data: {
        readAt: FIXED_NOW,
      },
      select: expect.any(Object),
    });
    expect(result.notification.readAt).toEqual(FIXED_NOW);
  });

  it('does not mark missing or foreign notifications as read', async () => {
    const { service, prisma } = createService();
    prisma.notification.findFirst.mockResolvedValue(null);

    await expect(
      service.markOneRead(CURRENT_USER, NOTIFICATION_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('marks all visible current user notifications as read', async () => {
    const { service, prisma } = createService();
    prisma.notification.updateMany.mockResolvedValue({ count: 2 });

    await expect(service.markAllRead(CURRENT_USER)).resolves.toEqual({
      success: true,
      markedReadCount: 2,
    });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        recipientUserId: CURRENT_USER_ID,
        readAt: null,
      }),
      data: {
        readAt: FIXED_NOW,
      },
    });
  });

  it('supports cursor pagination', async () => {
    const { service, prisma } = createService();
    prisma.notification.findMany.mockResolvedValue([
      makeNotification({ id: NOTIFICATION_ID }),
      makeNotification({ id: SECOND_NOTIFICATION_ID }),
    ]);

    const firstPage = await service.listMyNotifications(CURRENT_USER, {
      limit: 1,
      cursor: '  ',
    });

    expect(firstPage.notifications).toHaveLength(1);
    expect(firstPage.nextCursor).toBe(NOTIFICATION_ID);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
      }),
    );

    prisma.notification.findMany.mockResolvedValueOnce([]);
    await service.listMyNotifications(CURRENT_USER, {
      limit: 99,
      cursor: SECOND_NOTIFICATION_ID,
    });

    expect(prisma.notification.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cursor: {
          id: SECOND_NOTIFICATION_ID,
        },
        skip: 1,
        take: 51,
      }),
    );
  });

  it('rejects inactive current users before notification reads', async () => {
    const { service, prisma } = createService({
      user: {
        status: UserStatus.disabled,
        deletedAt: null,
      },
    });

    await expect(
      service.listMyNotifications(CURRENT_USER, query()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.notification.findMany).not.toHaveBeenCalled();
  });
});

function createService(
  options: {
    user?: {
      status: UserStatus;
      deletedAt: Date | null;
      notificationSettings?: {
        matchesEnabled: boolean;
        messagesEnabled: boolean;
      } | null;
    };
  } = {},
) {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(options.user ?? activeUser()),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: NOTIFICATION_ID }),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const moderationService: ModerationServiceMock = {
    hasBlockBetween: jest.fn().mockResolvedValue(false),
  };

  return {
    service: new NotificationsService(
      prisma as unknown as PrismaService,
      moderationService as unknown as ModerationService,
    ),
    prisma,
    moderationService,
  };
}

function activeUser(
  overrides: Partial<{
    status: UserStatus;
    deletedAt: Date | null;
    notificationSettings: {
      matchesEnabled: boolean;
      messagesEnabled: boolean;
    } | null;
  }> = {},
) {
  return {
    status: overrides.status ?? UserStatus.active,
    deletedAt: overrides.deletedAt ?? null,
    notificationSettings:
      overrides.notificationSettings === undefined
        ? {
            matchesEnabled: true,
            messagesEnabled: true,
          }
        : overrides.notificationSettings,
  };
}

function query(
  overrides: Partial<CursorPaginationQueryDto> = {},
): CursorPaginationQueryDto {
  return overrides as CursorPaginationQueryDto;
}

function makeNotification(
  overrides: Partial<{
    id: string;
    type: NotificationType;
    messageKey: string;
    readAt: Date | null;
    actorUserId: string | null;
    matchId: string | null;
    conversationId: string | null;
    messageId: string | null;
    actor: ReturnType<typeof makeActor> | null;
  }> = {},
) {
  return {
    id: overrides.id ?? NOTIFICATION_ID,
    type: overrides.type ?? NotificationType.message_received,
    messageKey: overrides.messageKey ?? NOTIFICATION_MESSAGE_KEYS.messageReceived,
    createdAt: FIXED_NOW,
    readAt: overrides.readAt ?? null,
    actorUserId: overrides.actorUserId === undefined ? ACTOR_USER_ID : overrides.actorUserId,
    matchId: overrides.matchId ?? null,
    conversationId: overrides.conversationId ?? CONVERSATION_ID,
    messageId: overrides.messageId ?? MESSAGE_ID,
    actor: overrides.actor === undefined ? makeActor() : overrides.actor,
  };
}

function makeActor(
  overrides: Partial<{
    id: string;
    status: UserStatus;
    deletedAt: Date | null;
    handle: string;
    displayName: string;
    photoUrl: string;
  }> = {},
) {
  const id = overrides.id ?? ACTOR_USER_ID;

  return {
    id,
    status: overrides.status ?? UserStatus.active,
    deletedAt: overrides.deletedAt ?? null,
    privacySettings: {
      profileVisibilityMode: ProfileVisibilityMode.open,
      showDisplayNameInPrivateMode: false,
      showBioInPrivateMode: false,
      showLocationInPrivateMode: false,
    },
    profile: {
      userId: id,
      handle: overrides.handle ?? 'actor_user',
      displayName: overrides.displayName ?? 'Actor User',
      photos: [
        {
          id: `${id.slice(0, 8)}-photo`,
          publicUrl: overrides.photoUrl ?? 'https://cdn.example.com/actor.jpg',
          blurhash: null,
          isPrimary: true,
          position: 0,
          moderationStatus: PhotoModerationStatus.approved,
          publishedAt: FIXED_NOW,
        },
      ],
    },
  };
}

function expectNoForbiddenKeys(value: unknown): void {
  const keys = collectObjectKeys(value);
  const serialized = JSON.stringify(value);
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
    'reports',
  ];

  for (const key of forbiddenKeys) {
    expect(keys).not.toContain(key);
  }

  expect(serialized).not.toContain('Hello');
  expect(serialized).not.toContain(THIRD_USER_ID);
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
