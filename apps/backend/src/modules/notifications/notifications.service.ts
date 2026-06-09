import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  NotificationType,
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
import { NOTIFICATION_MESSAGE_KEYS } from './notifications.constants';
import type {
  NotificationReadResponse,
  NotificationsListResponse,
  NotificationsReadAllResponse,
  NotificationsUnreadCountResponse,
  NotificationView,
} from './types/notification-view';

const RESOURCE_NOT_FOUND_MESSAGE = 'Resource not found';

const notificationActorProfileSelect = {
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

const notificationActorSelect = {
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
    select: notificationActorProfileSelect,
  },
} satisfies Prisma.UserSelect;

const notificationSelect = {
  id: true,
  type: true,
  messageKey: true,
  createdAt: true,
  readAt: true,
  actorUserId: true,
  matchId: true,
  conversationId: true,
  messageId: true,
  actor: {
    select: notificationActorSelect,
  },
} satisfies Prisma.NotificationSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderationService: ModerationService,
  ) {}

  async createMatchNotifications(input: {
    matchId: string;
    userAId: string;
    userBId: string;
    now?: Date;
  }): Promise<void> {
    const now = input.now ?? new Date();

    await Promise.all([
      this.createNotificationForRecipient({
        recipientUserId: input.userAId,
        actorUserId: input.userBId,
        type: NotificationType.match_created,
        messageKey: NOTIFICATION_MESSAGE_KEYS.matchCreated,
        matchId: input.matchId,
        settingsField: 'matchesEnabled',
        now,
      }),
      this.createNotificationForRecipient({
        recipientUserId: input.userBId,
        actorUserId: input.userAId,
        type: NotificationType.match_created,
        messageKey: NOTIFICATION_MESSAGE_KEYS.matchCreated,
        matchId: input.matchId,
        settingsField: 'matchesEnabled',
        now,
      }),
    ]);
  }

  async createMessageNotification(input: {
    recipientUserId: string;
    actorUserId: string;
    conversationId: string;
    messageId: string;
    now?: Date;
  }): Promise<void> {
    await this.createNotificationForRecipient({
      recipientUserId: input.recipientUserId,
      actorUserId: input.actorUserId,
      type: NotificationType.message_received,
      messageKey: NOTIFICATION_MESSAGE_KEYS.messageReceived,
      conversationId: input.conversationId,
      messageId: input.messageId,
      settingsField: 'messagesEnabled',
      now: input.now ?? new Date(),
    });
  }

  async listMyNotifications(
    currentUser: AuthenticatedUser,
    query: CursorPaginationQueryDto,
  ): Promise<NotificationsListResponse> {
    await this.assertActiveUser(currentUser.id);
    const pagination = normalizeCursorPagination(query);

    const notifications = await this.prisma.notification.findMany({
      where: this.visibleNotificationWhere(currentUser.id),
      select: notificationSelect,
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
    const page = buildCursorPage(
      notifications,
      pagination.limit,
      (notification) => notification.id,
    );

    return {
      notifications: page.items
        .map((notification) => this.toNotificationView(notification))
        .filter((notification): notification is NotificationView =>
          Boolean(notification),
        ),
      nextCursor: page.nextCursor,
    };
  }

  async getUnreadCount(
    currentUser: AuthenticatedUser,
  ): Promise<NotificationsUnreadCountResponse> {
    await this.assertActiveUser(currentUser.id);

    const unreadCount = await this.prisma.notification.count({
      where: {
        ...this.visibleNotificationWhere(currentUser.id),
        readAt: null,
      },
    });

    return {
      unreadCount,
    };
  }

  async markOneRead(
    currentUser: AuthenticatedUser,
    notificationId: string,
  ): Promise<NotificationReadResponse> {
    await this.assertActiveUser(currentUser.id);
    const existing = await this.findVisibleNotification(
      currentUser.id,
      notificationId,
    );

    if (!existing) {
      throw new NotFoundException(RESOURCE_NOT_FOUND_MESSAGE);
    }

    if (existing.readAt) {
      return {
        notification: this.toNotificationViewOrThrow(existing),
      };
    }

    const notification = await this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        readAt: new Date(),
      },
      select: notificationSelect,
    });

    return {
      notification: this.toNotificationViewOrThrow(notification),
    };
  }

  async markAllRead(
    currentUser: AuthenticatedUser,
  ): Promise<NotificationsReadAllResponse> {
    await this.assertActiveUser(currentUser.id);

    const result = await this.prisma.notification.updateMany({
      where: {
        ...this.visibleNotificationWhere(currentUser.id),
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      success: true,
      markedReadCount: result.count,
    };
  }

  private async createNotificationForRecipient(input: {
    recipientUserId: string;
    actorUserId: string;
    type: NotificationType;
    messageKey: string;
    matchId?: string;
    conversationId?: string;
    messageId?: string;
    settingsField: 'matchesEnabled' | 'messagesEnabled';
    now: Date;
  }): Promise<void> {
    if (input.recipientUserId === input.actorUserId) {
      return;
    }

    if (
      await this.moderationService.hasBlockBetween(
        input.recipientUserId,
        input.actorUserId,
      )
    ) {
      return;
    }

    const recipient = await this.prisma.user.findUnique({
      where: {
        id: input.recipientUserId,
      },
      select: {
        status: true,
        deletedAt: true,
        notificationSettings: {
          select: {
            matchesEnabled: true,
            messagesEnabled: true,
          },
        },
      },
    });

    if (
      !recipient ||
      recipient.status !== UserStatus.active ||
      recipient.deletedAt ||
      recipient.notificationSettings?.[input.settingsField] === false
    ) {
      return;
    }

    await this.prisma.notification.create({
      data: {
        recipientUserId: input.recipientUserId,
        actorUserId: input.actorUserId,
        type: input.type,
        messageKey: input.messageKey,
        matchId: input.matchId,
        conversationId: input.conversationId,
        messageId: input.messageId,
        createdAt: input.now,
      },
      select: {
        id: true,
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

  private findVisibleNotification(
    currentUserId: string,
    notificationId: string,
  ): Promise<NotificationRecord | null> {
    return this.prisma.notification.findFirst({
      where: {
        ...this.visibleNotificationWhere(currentUserId),
        id: notificationId,
      },
      select: notificationSelect,
    });
  }

  private visibleNotificationWhere(userId: string): Prisma.NotificationWhereInput {
    return {
      recipientUserId: userId,
      OR: [
        {
          type: NotificationType.system,
        },
        {
          actorUserId: {
            not: null,
          },
          actor: {
            is: {
              status: UserStatus.active,
              deletedAt: null,
              profile: {
                isNot: null,
              },
              blockedUsers: {
                none: {
                  blockedUserId: userId,
                },
              },
              blockedByUsers: {
                none: {
                  blockerUserId: userId,
                },
              },
            },
          },
        },
      ],
    };
  }

  private toNotificationViewOrThrow(
    notification: NotificationRecord,
  ): NotificationView {
    const view = this.toNotificationView(notification);

    if (!view) {
      throw new NotFoundException(RESOURCE_NOT_FOUND_MESSAGE);
    }

    return view;
  }

  private toNotificationView(
    notification: NotificationRecord,
  ): NotificationView | null {
    const isSystem = notification.type === NotificationType.system;
    const actor = notification.actor?.profile
      ? this.toActorView(
          toCompactProfile(
            notification.actor.profile,
            notification.actor.privacySettings,
          ),
        )
      : null;

    if (!isSystem && !actor) {
      return null;
    }

    return {
      id: notification.id,
      type: notification.type,
      messageKey: notification.messageKey,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      actor,
      matchId: notification.matchId,
      conversationId: notification.conversationId,
      messageId: notification.messageId,
    };
  }

  private toActorView(profile: CompactProfileView): NotificationView['actor'] {
    return {
      userId: profile.userId,
      handle: profile.handle,
      displayName: profile.displayName,
      primaryPhotoUrl: profile.primaryPhotoUrl,
    };
  }
}
