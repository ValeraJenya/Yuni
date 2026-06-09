import type { NotificationType } from '@prisma/client';

export interface NotificationActorView {
  userId: string;
  handle: string;
  displayName: string | null;
  primaryPhotoUrl: string | null;
}

export interface NotificationView {
  id: string;
  type: NotificationType;
  messageKey: string;
  createdAt: Date;
  readAt: Date | null;
  actor: NotificationActorView | null;
  matchId: string | null;
  conversationId: string | null;
  messageId: string | null;
}

export interface NotificationsListResponse {
  notifications: NotificationView[];
  nextCursor: string | null;
}

export interface NotificationsUnreadCountResponse {
  unreadCount: number;
}

export interface NotificationReadResponse {
  notification: NotificationView;
}

export interface NotificationsReadAllResponse {
  success: true;
  markedReadCount: number;
}
