import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  toExportBlock,
  toExportConversation,
  toExportGameAnswer,
  toExportLikeSent,
  toExportMatch,
  toExportMessage,
  toExportNotification,
  toExportPhoto,
  toExportProfile,
  toExportReport,
  toExportSession,
} from './user-data-export.serializer';
import {
  USER_DATA_EXPORT_SCHEMA_VERSION,
  type UserDataExport,
} from './types/user-data-export';

/**
 * Task 067a. Select-allowlist для каждой секции выгрузки.
 *
 * Везде select, нигде include: include тянет всю модель и любое новое поле
 * schema.prisma утекло бы в выгрузку само. Со select новое поле по умолчанию
 * не попадает никуда, пока его не добавят сюда осознанно.
 *
 * passwordHash, tokenHash, storageKey, anonymousAvatarKey, deletedAt пользователя
 * и внутренние поля модерации не запрашиваются вообще — их нет даже в памяти
 * процесса, а не только в ответе.
 */

const accountSelect = {
  id: true,
  email: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const profileSelect = {
  handle: true,
  displayName: true,
  birthDate: true,
  bio: true,
  gender: true,
  lookingFor: true,
  city: true,
  country: true,
  latitude: true,
  longitude: true,
  isDiscoverable: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProfileSelect;

const photoSelect = {
  id: true,
  publicUrl: true,
  blurhash: true,
  mimeType: true,
  width: true,
  height: true,
  position: true,
  isPrimary: true,
  moderationStatus: true,
  approvedAt: true,
  rejectedAt: true,
  publishedAt: true,
  createdAt: true,
} satisfies Prisma.ProfilePhotoSelect;

const interestSelect = {
  createdAt: true,
  interest: {
    select: {
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ProfileInterestSelect;

const sessionSelect = {
  deviceLabel: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  lastUsedAt: true,
  expiresAt: true,
  revokedAt: true,
} satisfies Prisma.RefreshTokenSelect;

const likeSentSelect = {
  likedUserId: true,
  kind: true,
  createdAt: true,
  expiresAt: true,
} satisfies Prisma.LikeSelect;

const matchSelect = {
  id: true,
  userAId: true,
  userBId: true,
  status: true,
  matchedAt: true,
  expiresAt: true,
  endedAt: true,
  createdAt: true,
  conversation: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.MatchSelect;

const conversationMemberSelect = {
  conversationId: true,
  joinedAt: true,
  leftAt: true,
  conversation: {
    select: {
      status: true,
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
        },
      },
    },
  },
} satisfies Prisma.ConversationParticipantSelect;

const messageSelect = {
  id: true,
  conversationId: true,
  body: true,
  voiceDurationSec: true,
  messageWeight: true,
  isSystemMessage: true,
  status: true,
  createdAt: true,
  editedAt: true,
  deletedAt: true,
} satisfies Prisma.MessageSelect;

const gameAnswerSelect = {
  gameId: true,
  answer: true,
  answeredAt: true,
  game: {
    select: {
      conversationId: true,
      question: true,
      gameType: true,
      stage: true,
    },
  },
} satisfies Prisma.GameAnswerSelect;

const blockSelect = {
  blockedUserId: true,
  reason: true,
  createdAt: true,
} satisfies Prisma.BlockSelect;

const reportSelect = {
  id: true,
  reportedUserId: true,
  reasonCode: true,
  comment: true,
  createdAt: true,
} satisfies Prisma.ReportSelect;

const privacySettingsSelect = {
  profileVisibilityMode: true,
  showDistance: true,
  showOnlineStatus: true,
  showDisplayNameInPrivateMode: true,
  showBioInPrivateMode: true,
  showLocationInPrivateMode: true,
  discoverable: true,
  allowMessagesFromMatchesOnly: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PrivacySettingsSelect;

const notificationSettingsSelect = {
  likesEnabled: true,
  matchesEnabled: true,
  messagesEnabled: true,
  productUpdatesEnabled: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSettingsSelect;

const notificationSelect = {
  id: true,
  type: true,
  messageKey: true,
  actorUserId: true,
  matchId: true,
  conversationId: true,
  messageId: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Выгрузка персональных данных текущего пользователя (ст. 15 и 20 GDPR,
   * ст. 14 152-ФЗ).
   *
   * Читает только данные, относящиеся к currentUser.id. Второй участник любого
   * взаимодействия представлен голым UUID: чужие профили, сообщения, лайки и
   * уведомления в выгрузку не попадают ни под каким видом. Обоснование по
   * каждому полю — docs/tasks/067a-user-data-export.md.
   */
  async exportMyData(currentUser: AuthenticatedUser): Promise<UserDataExport> {
    await this.assertActiveUser(currentUser.id);

    const userId = currentUser.id;

    // Одна транзакция на все чтения: иначе выгрузка склеивалась бы из снимков
    // разных моментов и могла бы, например, содержать сообщение в диалоге,
    // которого в секции conversations уже нет.
    const [
      account,
      profile,
      photos,
      interests,
      sessions,
      likesSent,
      matches,
      conversationMembers,
      messages,
      gameAnswers,
      blocksIssued,
      reportsFiled,
      privacySettings,
      notificationSettings,
      notifications,
    ] = await this.prisma.$transaction([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: accountSelect,
      }),
      this.prisma.profile.findUnique({
        where: { userId },
        select: profileSelect,
      }),
      this.prisma.profilePhoto.findMany({
        where: { userId },
        select: photoSelect,
        orderBy: { position: 'asc' },
      }),
      this.prisma.profileInterest.findMany({
        where: { profileUserId: userId },
        select: interestSelect,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.refreshToken.findMany({
        where: { userId },
        select: sessionSelect,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.like.findMany({
        // Только отправленные. likesReceived исключены осознанно: кто меня
        // лайкнул или пропустил — данные другого человека, и продукт их нигде
        // не показывает.
        where: { likerUserId: userId },
        select: likeSentSelect,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.match.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: matchSelect,
        orderBy: { matchedAt: 'asc' },
      }),
      this.prisma.conversationParticipant.findMany({
        where: { userId },
        select: conversationMemberSelect,
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.message.findMany({
        // Ключевой фильтр всей задачи: только собственные реплики. Сообщения
        // собеседника — его персональные данные, а не мои (ст. 15(4) GDPR).
        where: { senderUserId: userId },
        select: messageSelect,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.gameAnswer.findMany({
        where: { userId },
        select: gameAnswerSelect,
        orderBy: { answeredAt: 'asc' },
      }),
      this.prisma.block.findMany({
        // Только исходящие. Кто заблокировал меня — не выгружается: в дейтинге
        // это прямой риск для заблокировавшего.
        where: { blockerUserId: userId },
        select: blockSelect,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.report.findMany({
        // Только поданные мной. Жалобы на меня скрыты: они раскрыли бы личность
        // заявителя и сломали бы работу модерации.
        where: { reporterUserId: userId },
        select: reportSelect,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.privacySettings.findUnique({
        where: { userId },
        select: privacySettingsSelect,
      }),
      this.prisma.notificationSettings.findUnique({
        where: { userId },
        select: notificationSettingsSelect,
      }),
      this.prisma.notification.findMany({
        // Только полученные. notificationsActed — это чужие ленты.
        where: { recipientUserId: userId },
        select: notificationSelect,
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      schemaVersion: USER_DATA_EXPORT_SCHEMA_VERSION,
      exportedAt: new Date(),
      account,
      profile: profile ? toExportProfile(profile) : null,
      photos: photos.map(toExportPhoto),
      interests: interests.map((row) => ({
        name: row.interest.name,
        slug: row.interest.slug,
        addedAt: row.createdAt,
      })),
      sessions: sessions.map(toExportSession),
      likesSent: likesSent.map(toExportLikeSent),
      matches: matches.map((match) => toExportMatch(match, userId)),
      conversations: conversationMembers.map((member) =>
        toExportConversation(member, userId),
      ),
      messages: messages.map(toExportMessage),
      gameAnswers: gameAnswers.map(toExportGameAnswer),
      blocksIssued: blocksIssued.map(toExportBlock),
      reportsFiled: reportsFiled.map(toExportReport),
      privacySettings,
      notificationSettings,
      notifications: notifications.map(toExportNotification),
    };
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
}
