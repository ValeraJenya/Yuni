import type {
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

/**
 * Task 067a. Явный контракт выгрузки персональных данных.
 *
 * Состав определён построчным разбором полей модели User в
 * docs/tasks/067a-user-data-export.md. Каждое поле схемы там имеет решение
 * «включено / исключено» с причиной, в том числе исключённые.
 *
 * Два правила, которые держат весь контракт:
 *
 * 1. Allowlist, а не вычитание. Новое поле в schema.prisma по умолчанию НЕ
 *    попадает в выгрузку, пока его сюда не добавят осознанно.
 * 2. Второй участник — всегда голый UUID. Ни одна секция не подтягивает чужой
 *    профиль, чужие сообщения, чужие лайки или чужие уведомления.
 */

/** Версия формата. Растёт при несовместимом изменении состава выгрузки. */
export const USER_DATA_EXPORT_SCHEMA_VERSION = 1;

export interface UserDataExportAccount {
  id: string;
  email: string;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDataExportProfile {
  handle: string;
  displayName: string;
  birthDate: Date;
  bio: string | null;
  gender: string | null;
  lookingFor: string | null;
  city: string | null;
  country: string | null;
  /**
   * Колонки существуют в схеме, но ни один обработчик их не пишет и не читает
   * (0 совпадений на grep по apps/backend/src), поэтому всегда null. В выгрузке
   * остаются намеренно: инвентарь должен показывать заведённое место под
   * геоданные, а не умалчивать о нём.
   */
  latitude: string | null;
  longitude: string | null;
  isDiscoverable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDataExportPhoto {
  id: string;
  publicUrl: string | null;
  blurhash: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  position: number;
  isPrimary: boolean;
  moderationStatus: PhotoModerationStatus;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface UserDataExportInterest {
  name: string;
  slug: string;
  addedAt: Date;
}

/**
 * Метаданные сессий без tokenHash. IP и User-Agent пишутся при каждом логине и
 * refresh (auth.service.ts:368 и :418), пользователь их нигде в интерфейсе не
 * видит — поэтому место им ровно в выгрузке.
 */
export interface UserDataExportSession {
  deviceLabel: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface UserDataExportLikeSent {
  likedUserId: string;
  kind: LikeKind;
  createdAt: Date;
  expiresAt: Date;
}

export interface UserDataExportMatch {
  id: string;
  otherUserId: string;
  conversationId: string | null;
  status: MatchStatus;
  matchedAt: Date;
  expiresAt: Date;
  endedAt: Date | null;
  createdAt: Date;
}

export interface UserDataExportConversation {
  conversationId: string;
  joinedAt: Date;
  leftAt: Date | null;
  status: ConversationStatus;
  stage: number;
  stage1StartedAt: Date | null;
  stage2StartedAt: Date | null;
  stage3StartedAt: Date | null;
  stageUpdatedAt: Date | null;
  /** Только собственный тотал. Тотал второго участника отдавать запрещено. */
  voiceTotalSec: number;
}

export interface UserDataExportMessage {
  id: string;
  conversationId: string;
  /** Значение Message.body под именем text — как требует data-exposure-rules. */
  text: string;
  voiceDurationSec: number | null;
  messageWeight: number;
  isSystemMessage: boolean;
  /**
   * Удалённые сообщения выгружаются вместе с телом и помечены здесь как
   * deleted: Message.body при удалении не обнуляется, текст физически остаётся
   * в базе. Инвентарь, который прячет реально хранимое тело, врал бы о
   * содержимом базы.
   */
  status: MessageStatus;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
}

export interface UserDataExportGameAnswer {
  gameId: string;
  conversationId: string;
  /** Системный контент, не персональные данные. Без него ответ бессмыслен. */
  question: string;
  gameType: string;
  stage: number;
  answer: string;
  answeredAt: Date;
}

export interface UserDataExportBlock {
  blockedUserId: string;
  reason: string | null;
  createdAt: Date;
}

export interface UserDataExportReport {
  id: string;
  reportedUserId: string;
  reasonCode: ReportReasonCode;
  comment: string | null;
  /** Публичное значение, как в контракте Reports. Внутренний статус скрыт. */
  status: 'received';
  createdAt: Date;
}

export interface UserDataExportPrivacySettings {
  profileVisibilityMode: ProfileVisibilityMode;
  showDistance: boolean;
  showOnlineStatus: boolean;
  showDisplayNameInPrivateMode: boolean;
  showBioInPrivateMode: boolean;
  showLocationInPrivateMode: boolean;
  discoverable: boolean;
  allowMessagesFromMatchesOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDataExportNotificationSettings {
  likesEnabled: boolean;
  matchesEnabled: boolean;
  messagesEnabled: boolean;
  productUpdatesEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDataExportNotification {
  id: string;
  type: NotificationType;
  messageKey: string;
  actorUserId: string | null;
  matchId: string | null;
  conversationId: string | null;
  messageId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface UserDataExport {
  schemaVersion: number;
  exportedAt: Date;
  account: UserDataExportAccount;
  profile: UserDataExportProfile | null;
  photos: UserDataExportPhoto[];
  /** Всегда пусто: фича интересов не реализована (Task 050). */
  interests: UserDataExportInterest[];
  sessions: UserDataExportSession[];
  likesSent: UserDataExportLikeSent[];
  matches: UserDataExportMatch[];
  conversations: UserDataExportConversation[];
  /** Только собственные сообщения. Реплики собеседника не выгружаются. */
  messages: UserDataExportMessage[];
  gameAnswers: UserDataExportGameAnswer[];
  blocksIssued: UserDataExportBlock[];
  reportsFiled: UserDataExportReport[];
  privacySettings: UserDataExportPrivacySettings | null;
  notificationSettings: UserDataExportNotificationSettings | null;
  notifications: UserDataExportNotification[];
}
