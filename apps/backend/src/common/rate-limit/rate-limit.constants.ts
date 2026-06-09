import type { RateLimitPolicy } from './rate-limit.types';

export const RATE_LIMIT_POLICIES_METADATA = Symbol('RATE_LIMIT_POLICIES');

export const RATE_LIMIT_WINDOW_MS = {
  minute: 60_000,
  tenMinutes: 10 * 60_000,
  hour: 60 * 60_000,
} as const;

export const RATE_LIMIT_POLICIES = {
  authRegister: [
    {
      name: 'auth.register.ip',
      limit: 3,
      windowMs: RATE_LIMIT_WINDOW_MS.hour,
      key: 'ip',
    },
  ],
  authLogin: [
    {
      name: 'auth.login.ip',
      limit: 20,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'ip',
    },
    {
      name: 'auth.login.ipEmailHash',
      limit: 5,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'ip-email-hash',
    },
  ],
  authRefresh: [
    {
      name: 'auth.refresh.ip',
      limit: 30,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'ip',
    },
  ],
  authLogout: [
    {
      name: 'auth.logout.ip',
      limit: 30,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'ip',
    },
  ],
  likesAction: [
    {
      name: 'likes.action.user',
      limit: 60,
      windowMs: RATE_LIMIT_WINDOW_MS.hour,
      key: 'user',
    },
  ],
  chatSend: [
    {
      name: 'chat.send.user.minute',
      limit: 30,
      windowMs: RATE_LIMIT_WINDOW_MS.minute,
      key: 'user',
    },
    {
      name: 'chat.send.user.tenMinutes',
      limit: 120,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'user',
    },
  ],
  reportCreate: [
    {
      name: 'reports.create.user',
      limit: 10,
      windowMs: RATE_LIMIT_WINDOW_MS.hour,
      key: 'user',
    },
  ],
  discoveryCards: [
    {
      name: 'discovery.cards.user',
      limit: 120,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'user',
    },
  ],
  publicProfileLookup: [
    {
      name: 'profiles.publicLookup.user',
      limit: 120,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'user',
    },
  ],
  notificationsList: [
    {
      name: 'notifications.list.user',
      limit: 120,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'user',
    },
  ],
  notificationsUnreadCount: [
    {
      name: 'notifications.unreadCount.user',
      limit: 240,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'user',
    },
  ],
  notificationsMarkRead: [
    {
      name: 'notifications.markRead.user',
      limit: 120,
      windowMs: RATE_LIMIT_WINDOW_MS.tenMinutes,
      key: 'user',
    },
  ],
} as const satisfies Record<string, RateLimitPolicy>;
