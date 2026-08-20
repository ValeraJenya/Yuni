import { UnauthorizedException } from '@nestjs/common';
import {
  ConversationStatus,
  LikeKind,
  MatchStatus,
  MessageStatus,
  NotificationType,
  PhotoModerationStatus,
  ProfileVisibilityMode,
  ReportReasonCode,
  UserStatus,
} from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UsersService } from './users.service';

const CURRENT_USER: AuthenticatedUser = {
  id: 'user-1',
  email: 'person@example.test',
};

const OTHER_USER_ID = 'user-2';

/**
 * Ключи, которых не должно быть в выгрузке ни на одном уровне вложенности.
 * Проверяются обходом дерева ответа, а не выборочно по секциям: смысл в том,
 * чтобы тест ловил утечку в секции, которой на момент его написания ещё нет.
 */
const FORBIDDEN_KEYS = [
  'passwordHash',
  'tokenHash',
  'storageKey',
  'anonymousAvatarKey',
  'revokedReason',
  'resolutionNote',
  'resolvedAt',
  'lastReadMessageId',
  'user1VoiceTotalSec',
  'user2VoiceTotalSec',
  'senderUserId',
  'likerUserId',
  'blockerUserId',
  'reporterUserId',
  'recipientUserId',
];

describe('UsersService.exportMyData', () => {
  it('returns every section and never leaks a forbidden key at any depth', async () => {
    const { service } = createService();

    const result = await service.exportMyData(CURRENT_USER);

    expect(Object.keys(result).sort()).toEqual(
      [
        'account',
        'blocksIssued',
        'conversations',
        'exportedAt',
        'gameAnswers',
        'interests',
        'likesSent',
        'matches',
        'messages',
        'notificationSettings',
        'notifications',
        'photos',
        'privacySettings',
        'profile',
        'reportsFiled',
        'schemaVersion',
        'sessions',
      ].sort(),
    );

    const keys = collectKeys(result);
    for (const forbidden of FORBIDDEN_KEYS) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('serializes the account without passwordHash or deletedAt', async () => {
    const { service, prisma } = createService();

    const result = await service.exportMyData(CURRENT_USER);

    expect(result.account).toEqual({
      id: CURRENT_USER.id,
      email: CURRENT_USER.email,
      status: UserStatus.active,
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    const accountSelect = prisma.user.findUniqueOrThrow.mock.calls[0][0].select;
    expect(accountSelect).not.toHaveProperty('passwordHash');
    expect(accountSelect).not.toHaveProperty('deletedAt');
  });

  it('asks the database only for messages the current user sent', async () => {
    const { service, prisma } = createService();

    await service.exportMyData(CURRENT_USER);

    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { senderUserId: CURRENT_USER.id },
      }),
    );
  });

  it('scopes every own-side collection to the current user', async () => {
    const { service, prisma } = createService();

    await service.exportMyData(CURRENT_USER);

    // Каждая пара — «выгружаем только свою сторону». Обратная сторона
    // (likesReceived, blockedByUsers, reportsReceived, notificationsActed) не
    // запрашивается вообще, поэтому её нечем утечь.
    expect(prisma.like.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { likerUserId: CURRENT_USER.id } }),
    );
    expect(prisma.block.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { blockerUserId: CURRENT_USER.id } }),
    );
    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reporterUserId: CURRENT_USER.id } }),
    );
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientUserId: CURRENT_USER.id } }),
    );
  });

  it('never requests tokenHash, storageKey or anonymousAvatarKey', async () => {
    const { service, prisma } = createService();

    await service.exportMyData(CURRENT_USER);

    expect(
      prisma.refreshToken.findMany.mock.calls[0][0].select,
    ).not.toHaveProperty('tokenHash');
    expect(
      prisma.profilePhoto.findMany.mock.calls[0][0].select,
    ).not.toHaveProperty('storageKey');
    expect(
      prisma.privacySettings.findUnique.mock.calls[0][0].select,
    ).not.toHaveProperty('anonymousAvatarKey');
  });

  it('keeps a deleted own message with its body and a deleted status', async () => {
    const { service } = createService();

    const result = await service.exportMyData(CURRENT_USER);
    const deleted = result.messages.find(
      (message) => message.status === MessageStatus.deleted,
    );

    // Message.body при удалении не обнуляется — текст остаётся в базе.
    // Выгрузка, которая его прячет, врала бы о содержимом базы.
    expect(deleted).toBeDefined();
    expect(deleted?.text).toBe('Synthetic deleted message');
    expect(deleted?.deletedAt).toBeInstanceOf(Date);
  });

  it('reports the other side of a match as a bare uuid', async () => {
    const { service } = createService();

    const result = await service.exportMyData(CURRENT_USER);

    expect(result.matches).toHaveLength(2);
    // Пользователь бывает и userA, и userB — наружу это не выходит.
    expect(result.matches.map((match) => match.otherUserId)).toEqual([
      OTHER_USER_ID,
      OTHER_USER_ID,
    ]);
    expect(result.matches[0]).not.toHaveProperty('userAId');
    expect(result.matches[0]).not.toHaveProperty('userBId');
  });

  it('returns only the current user voice total for a conversation', async () => {
    const { service } = createService();

    const result = await service.exportMyData(CURRENT_USER);

    // Первый диалог: матч, где текущий пользователь — userA, значит его тотал
    // это user1VoiceTotalSec. Второй: userA — собеседник, значит user2.
    expect(result.conversations[0].voiceTotalSec).toBe(11);
    expect(result.conversations[1].voiceTotalSec).toBe(22);
  });

  it('hides the internal report workflow behind a public status', async () => {
    const { service } = createService();

    const result = await service.exportMyData(CURRENT_USER);

    expect(result.reportsFiled).toEqual([
      {
        id: 'report-1',
        reportedUserId: OTHER_USER_ID,
        reasonCode: ReportReasonCode.spam,
        comment: 'Synthetic report comment',
        status: 'received',
        createdAt: expect.any(Date),
      },
    ]);
  });

  it('returns an empty interests section because the feature does not exist', async () => {
    const { service } = createService();

    const result = await service.exportMyData(CURRENT_USER);

    // Task 050: таблицы есть, кода нет. Секция присутствует пустой намеренно —
    // отсутствие данных тоже ответ на вопрос «что вы обо мне храните».
    expect(result.interests).toEqual([]);
  });

  it('rejects a soft-deleted user even with a still valid token', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.active,
      deletedAt: new Date(),
    });

    await expect(service.exportMyData(CURRENT_USER)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a disabled user', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.disabled,
      deletedAt: null,
    });

    await expect(service.exportMyData(CURRENT_USER)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

function collectKeys(value: unknown, seen: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, seen);
    }
    return seen;
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    for (const [key, nested] of Object.entries(value)) {
      seen.push(key);
      collectKeys(nested, seen);
    }
  }

  return seen;
}

function createService() {
  const prisma = {
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
    user: {
      findUnique: jest.fn().mockResolvedValue({
        status: UserStatus.active,
        deletedAt: null,
      }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: CURRENT_USER.id,
        email: CURRENT_USER.email,
        status: UserStatus.active,
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    },
    profile: {
      findUnique: jest.fn().mockResolvedValue({
        handle: 'synthetic',
        displayName: 'Synthetic',
        birthDate: new Date('1995-05-15T00:00:00.000Z'),
        bio: 'Synthetic bio',
        gender: 'woman',
        lookingFor: 'man',
        city: 'Synthetic city',
        country: 'Synthetic country',
        latitude: null,
        longitude: null,
        isDiscoverable: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    },
    profilePhoto: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'photo-1',
          publicUrl: '/uploads/synthetic.jpg',
          blurhash: null,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          position: 0,
          isPrimary: true,
          moderationStatus: PhotoModerationStatus.approved,
          approvedAt: new Date('2026-01-03T00:00:00.000Z'),
          rejectedAt: null,
          publishedAt: new Date('2026-01-03T00:00:00.000Z'),
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
        },
      ]),
    },
    profileInterest: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    refreshToken: {
      findMany: jest.fn().mockResolvedValue([
        {
          deviceLabel: null,
          ipAddress: '203.0.113.10',
          userAgent: 'synthetic-agent/1.0',
          createdAt: new Date('2026-01-04T00:00:00.000Z'),
          lastUsedAt: null,
          expiresAt: new Date('2026-02-04T00:00:00.000Z'),
          revokedAt: null,
        },
      ]),
    },
    like: {
      findMany: jest.fn().mockResolvedValue([
        {
          likedUserId: OTHER_USER_ID,
          kind: LikeKind.like,
          createdAt: new Date('2026-01-05T00:00:00.000Z'),
          expiresAt: new Date('2026-01-12T00:00:00.000Z'),
        },
      ]),
    },
    match: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'match-1',
          userAId: CURRENT_USER.id,
          userBId: OTHER_USER_ID,
          status: MatchStatus.active,
          matchedAt: new Date('2026-01-06T00:00:00.000Z'),
          expiresAt: new Date('2026-01-13T00:00:00.000Z'),
          endedAt: null,
          createdAt: new Date('2026-01-06T00:00:00.000Z'),
          conversation: { id: 'conversation-1' },
        },
        {
          id: 'match-2',
          userAId: OTHER_USER_ID,
          userBId: CURRENT_USER.id,
          status: MatchStatus.active,
          matchedAt: new Date('2026-01-07T00:00:00.000Z'),
          expiresAt: new Date('2026-01-14T00:00:00.000Z'),
          endedAt: null,
          createdAt: new Date('2026-01-07T00:00:00.000Z'),
          conversation: null,
        },
      ]),
    },
    conversationParticipant: {
      findMany: jest.fn().mockResolvedValue([
        {
          conversationId: 'conversation-1',
          joinedAt: new Date('2026-01-06T00:00:00.000Z'),
          leftAt: null,
          conversation: {
            status: ConversationStatus.active,
            stage: 1,
            stage1StartedAt: new Date('2026-01-06T00:00:00.000Z'),
            stage2StartedAt: null,
            stage3StartedAt: null,
            stageUpdatedAt: null,
            user1VoiceTotalSec: 11,
            user2VoiceTotalSec: 99,
            match: { userAId: CURRENT_USER.id },
          },
        },
        {
          conversationId: 'conversation-2',
          joinedAt: new Date('2026-01-07T00:00:00.000Z'),
          leftAt: null,
          conversation: {
            status: ConversationStatus.active,
            stage: 2,
            stage1StartedAt: new Date('2026-01-07T00:00:00.000Z'),
            stage2StartedAt: new Date('2026-01-08T00:00:00.000Z'),
            stage3StartedAt: null,
            stageUpdatedAt: new Date('2026-01-08T00:00:00.000Z'),
            user1VoiceTotalSec: 88,
            user2VoiceTotalSec: 22,
            match: { userAId: OTHER_USER_ID },
          },
        },
      ]),
    },
    message: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'message-1',
          conversationId: 'conversation-1',
          body: 'Synthetic own message',
          voiceDurationSec: null,
          messageWeight: 1,
          isSystemMessage: false,
          status: MessageStatus.sent,
          createdAt: new Date('2026-01-09T00:00:00.000Z'),
          editedAt: null,
          deletedAt: null,
        },
        {
          id: 'message-2',
          conversationId: 'conversation-1',
          body: 'Synthetic deleted message',
          voiceDurationSec: null,
          messageWeight: 1,
          isSystemMessage: false,
          status: MessageStatus.deleted,
          createdAt: new Date('2026-01-10T00:00:00.000Z'),
          editedAt: null,
          deletedAt: new Date('2026-01-11T00:00:00.000Z'),
        },
      ]),
    },
    gameAnswer: {
      findMany: jest.fn().mockResolvedValue([
        {
          gameId: 'game-1',
          answer: 'Synthetic answer',
          answeredAt: new Date('2026-01-12T00:00:00.000Z'),
          game: {
            conversationId: 'conversation-1',
            question: 'Synthetic question',
            gameType: 'synthetic',
            stage: 1,
          },
        },
      ]),
    },
    block: {
      findMany: jest.fn().mockResolvedValue([
        {
          blockedUserId: OTHER_USER_ID,
          reason: null,
          createdAt: new Date('2026-01-13T00:00:00.000Z'),
        },
      ]),
    },
    report: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'report-1',
          reportedUserId: OTHER_USER_ID,
          reasonCode: ReportReasonCode.spam,
          comment: 'Synthetic report comment',
          createdAt: new Date('2026-01-14T00:00:00.000Z'),
        },
      ]),
    },
    privacySettings: {
      findUnique: jest.fn().mockResolvedValue({
        profileVisibilityMode: ProfileVisibilityMode.open,
        showDistance: true,
        showOnlineStatus: false,
        showDisplayNameInPrivateMode: false,
        showBioInPrivateMode: false,
        showLocationInPrivateMode: false,
        discoverable: true,
        allowMessagesFromMatchesOnly: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    },
    notificationSettings: {
      findUnique: jest.fn().mockResolvedValue({
        likesEnabled: true,
        matchesEnabled: true,
        messagesEnabled: true,
        productUpdatesEnabled: false,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    },
    notification: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'notification-1',
          type: NotificationType.match_created,
          messageKey: 'notifications.match_created',
          actorUserId: OTHER_USER_ID,
          matchId: 'match-1',
          conversationId: null,
          messageId: null,
          readAt: null,
          createdAt: new Date('2026-01-06T00:00:00.000Z'),
        },
      ]),
    },
  };

  const service = new UsersService(prisma as unknown as PrismaService);

  return { service, prisma };
}
