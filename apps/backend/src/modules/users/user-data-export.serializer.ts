import type { Prisma } from '@prisma/client';
import type {
  UserDataExportBlock,
  UserDataExportConversation,
  UserDataExportGameAnswer,
  UserDataExportLikeSent,
  UserDataExportMatch,
  UserDataExportMessage,
  UserDataExportNotification,
  UserDataExportPhoto,
  UserDataExportProfile,
  UserDataExportReport,
  UserDataExportSession,
} from './types/user-data-export';

/**
 * Task 067a. Сериализаторы выгрузки.
 *
 * Каждая функция принимает строку, уже суженную select-allowlist-ом в
 * UsersService, и приводит её к явному экспортному типу. Слой существует не
 * ради переименований, а чтобы запрещённые поля отсекались дважды: сначала
 * select не запрашивает их из базы, потом сериализатор не может их вернуть,
 * потому что их нет во входном типе.
 */

export type ProfileExportSource = Prisma.ProfileGetPayload<{
  select: {
    handle: true;
    displayName: true;
    birthDate: true;
    bio: true;
    gender: true;
    lookingFor: true;
    city: true;
    country: true;
    latitude: true;
    longitude: true;
    isDiscoverable: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

export type PhotoExportSource = Prisma.ProfilePhotoGetPayload<{
  select: {
    id: true;
    publicUrl: true;
    blurhash: true;
    mimeType: true;
    width: true;
    height: true;
    position: true;
    isPrimary: true;
    moderationStatus: true;
    approvedAt: true;
    rejectedAt: true;
    publishedAt: true;
    createdAt: true;
  };
}>;

export type SessionExportSource = Prisma.RefreshTokenGetPayload<{
  select: {
    deviceLabel: true;
    ipAddress: true;
    userAgent: true;
    createdAt: true;
    lastUsedAt: true;
    expiresAt: true;
    revokedAt: true;
  };
}>;

export type LikeSentExportSource = Prisma.LikeGetPayload<{
  select: {
    likedUserId: true;
    kind: true;
    createdAt: true;
    expiresAt: true;
  };
}>;

export type MatchExportSource = Prisma.MatchGetPayload<{
  select: {
    id: true;
    userAId: true;
    userBId: true;
    status: true;
    matchedAt: true;
    expiresAt: true;
    endedAt: true;
    createdAt: true;
    conversation: { select: { id: true } };
  };
}>;

export type ConversationMemberExportSource =
  Prisma.ConversationParticipantGetPayload<{
    select: {
      conversationId: true;
      joinedAt: true;
      leftAt: true;
      conversation: {
        select: {
          status: true;
          stage: true;
          stage1StartedAt: true;
          stage2StartedAt: true;
          stage3StartedAt: true;
          stageUpdatedAt: true;
          user1VoiceTotalSec: true;
          user2VoiceTotalSec: true;
          match: { select: { userAId: true } };
        };
      };
    };
  }>;

export type MessageExportSource = Prisma.MessageGetPayload<{
  select: {
    id: true;
    conversationId: true;
    body: true;
    voiceDurationSec: true;
    messageWeight: true;
    isSystemMessage: true;
    status: true;
    createdAt: true;
    editedAt: true;
    deletedAt: true;
  };
}>;

export type GameAnswerExportSource = Prisma.GameAnswerGetPayload<{
  select: {
    gameId: true;
    answer: true;
    answeredAt: true;
    game: {
      select: {
        conversationId: true;
        question: true;
        gameType: true;
        stage: true;
      };
    };
  };
}>;

export type BlockExportSource = Prisma.BlockGetPayload<{
  select: {
    blockedUserId: true;
    reason: true;
    createdAt: true;
  };
}>;

export type ReportExportSource = Prisma.ReportGetPayload<{
  select: {
    id: true;
    reportedUserId: true;
    reasonCode: true;
    comment: true;
    createdAt: true;
  };
}>;

export type NotificationExportSource = Prisma.NotificationGetPayload<{
  select: {
    id: true;
    type: true;
    messageKey: true;
    actorUserId: true;
    matchId: true;
    conversationId: true;
    messageId: true;
    readAt: true;
    createdAt: true;
  };
}>;

export function toExportProfile(
  profile: ProfileExportSource,
): UserDataExportProfile {
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    birthDate: profile.birthDate,
    bio: profile.bio,
    gender: profile.gender,
    lookingFor: profile.lookingFor,
    city: profile.city,
    country: profile.country,
    // Prisma отдаёт Decimal; наружу уходит строка, а не внутренний объект.
    latitude: profile.latitude?.toString() ?? null,
    longitude: profile.longitude?.toString() ?? null,
    isDiscoverable: profile.isDiscoverable,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function toExportPhoto(photo: PhotoExportSource): UserDataExportPhoto {
  return {
    id: photo.id,
    publicUrl: photo.publicUrl,
    blurhash: photo.blurhash,
    mimeType: photo.mimeType,
    width: photo.width,
    height: photo.height,
    position: photo.position,
    isPrimary: photo.isPrimary,
    moderationStatus: photo.moderationStatus,
    approvedAt: photo.approvedAt,
    rejectedAt: photo.rejectedAt,
    publishedAt: photo.publishedAt,
    createdAt: photo.createdAt,
  };
}

export function toExportSession(
  session: SessionExportSource,
): UserDataExportSession {
  return {
    deviceLabel: session.deviceLabel,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
  };
}

export function toExportLikeSent(
  like: LikeSentExportSource,
): UserDataExportLikeSent {
  return {
    likedUserId: like.likedUserId,
    kind: like.kind,
    createdAt: like.createdAt,
    expiresAt: like.expiresAt,
  };
}

export function toExportMatch(
  match: MatchExportSource,
  currentUserId: string,
): UserDataExportMatch {
  return {
    id: match.id,
    // Какая сторона userA, а какая userB — внутренняя деталь схемы.
    otherUserId:
      match.userAId === currentUserId ? match.userBId : match.userAId,
    conversationId: match.conversation?.id ?? null,
    status: match.status,
    matchedAt: match.matchedAt,
    expiresAt: match.expiresAt,
    endedAt: match.endedAt,
    createdAt: match.createdAt,
  };
}

export function toExportConversation(
  member: ConversationMemberExportSource,
  currentUserId: string,
): UserDataExportConversation {
  const { conversation } = member;

  // Та же логика, что в chat.service.ts (isFirstVoiceParticipant):
  // первый голосовой участник — userA матча. Тотал второго не отдаём.
  const isFirstVoiceParticipant =
    conversation.match?.userAId === currentUserId;

  return {
    conversationId: member.conversationId,
    joinedAt: member.joinedAt,
    leftAt: member.leftAt,
    status: conversation.status,
    stage: conversation.stage,
    stage1StartedAt: conversation.stage1StartedAt,
    stage2StartedAt: conversation.stage2StartedAt,
    stage3StartedAt: conversation.stage3StartedAt,
    stageUpdatedAt: conversation.stageUpdatedAt,
    voiceTotalSec: isFirstVoiceParticipant
      ? conversation.user1VoiceTotalSec
      : conversation.user2VoiceTotalSec,
  };
}

export function toExportMessage(
  message: MessageExportSource,
): UserDataExportMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    text: message.body,
    voiceDurationSec: message.voiceDurationSec,
    messageWeight: message.messageWeight,
    isSystemMessage: message.isSystemMessage,
    status: message.status,
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
  };
}

export function toExportGameAnswer(
  gameAnswer: GameAnswerExportSource,
): UserDataExportGameAnswer {
  return {
    gameId: gameAnswer.gameId,
    conversationId: gameAnswer.game.conversationId,
    question: gameAnswer.game.question,
    gameType: gameAnswer.game.gameType,
    stage: gameAnswer.game.stage,
    answer: gameAnswer.answer,
    answeredAt: gameAnswer.answeredAt,
  };
}

export function toExportBlock(block: BlockExportSource): UserDataExportBlock {
  return {
    blockedUserId: block.blockedUserId,
    reason: block.reason,
    createdAt: block.createdAt,
  };
}

export function toExportReport(
  report: ReportExportSource,
): UserDataExportReport {
  return {
    id: report.id,
    reportedUserId: report.reportedUserId,
    reasonCode: report.reasonCode,
    comment: report.comment,
    // Внутренний ReportStatus, resolutionNote и resolvedAt наружу не идут.
    status: 'received',
    createdAt: report.createdAt,
  };
}

export function toExportNotification(
  notification: NotificationExportSource,
): UserDataExportNotification {
  return {
    id: notification.id,
    type: notification.type,
    messageKey: notification.messageKey,
    actorUserId: notification.actorUserId,
    matchId: notification.matchId,
    conversationId: notification.conversationId,
    messageId: notification.messageId,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}
