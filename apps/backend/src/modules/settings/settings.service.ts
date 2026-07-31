import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { assertFound } from '../../common/security/access-control';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { UpdatePrivacySettingsDto } from './dto/update-privacy-settings.dto';

const privacySettingsSelect = {
  profileVisibilityMode: true,
  showDistance: true,
  showOnlineStatus: true,
  showDisplayNameInPrivateMode: true,
  showBioInPrivateMode: true,
  showLocationInPrivateMode: true,
  discoverable: true,
  allowMessagesFromMatchesOnly: true,
} satisfies Prisma.PrivacySettingsSelect;

const notificationSettingsSelect = {
  likesEnabled: true,
  matchesEnabled: true,
  messagesEnabled: true,
  productUpdatesEnabled: true,
} satisfies Prisma.NotificationSettingsSelect;

type PrivacySettingsView = Prisma.PrivacySettingsGetPayload<{
  select: typeof privacySettingsSelect;
}>;

type NotificationSettingsView = Prisma.NotificationSettingsGetPayload<{
  select: typeof notificationSettingsSelect;
}>;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPrivacySettings(
    currentUser: AuthenticatedUser,
  ): Promise<{ privacySettings: PrivacySettingsView }> {
    await this.assertActiveUser(currentUser.id);
    const privacySettings = await this.findPrivacySettings(currentUser.id);
    assertFound(privacySettings);

    return { privacySettings };
  }

  async updatePrivacySettings(
    currentUser: AuthenticatedUser,
    dto: UpdatePrivacySettingsDto,
  ): Promise<{ privacySettings: PrivacySettingsView }> {
    await this.assertActiveUser(currentUser.id);
    const existing = await this.findPrivacySettings(currentUser.id);
    assertFound(existing);

    const data = this.buildPrivacySettingsUpdateData(dto);

    if (Object.keys(data).length === 0) {
      return { privacySettings: existing };
    }

    const privacySettings = await this.prisma.privacySettings.update({
      where: { userId: currentUser.id },
      data,
      select: privacySettingsSelect,
    });

    return { privacySettings };
  }

  async getNotificationSettings(
    currentUser: AuthenticatedUser,
  ): Promise<{ notificationSettings: NotificationSettingsView }> {
    await this.assertActiveUser(currentUser.id);
    const notificationSettings = await this.findNotificationSettings(
      currentUser.id,
    );
    assertFound(notificationSettings);

    return { notificationSettings };
  }

  async updateNotificationSettings(
    currentUser: AuthenticatedUser,
    dto: UpdateNotificationSettingsDto,
  ): Promise<{ notificationSettings: NotificationSettingsView }> {
    await this.assertActiveUser(currentUser.id);
    const existing = await this.findNotificationSettings(currentUser.id);
    assertFound(existing);

    const data = this.buildNotificationSettingsUpdateData(dto);

    if (Object.keys(data).length === 0) {
      return { notificationSettings: existing };
    }

    const notificationSettings = await this.prisma.notificationSettings.update({
      where: { userId: currentUser.id },
      data,
      select: notificationSettingsSelect,
    });

    return { notificationSettings };
  }

  private findPrivacySettings(userId: string): Promise<PrivacySettingsView | null> {
    return this.prisma.privacySettings.findUnique({
      where: { userId },
      select: privacySettingsSelect,
    });
  }

  private findNotificationSettings(
    userId: string,
  ): Promise<NotificationSettingsView | null> {
    return this.prisma.notificationSettings.findUnique({
      where: { userId },
      select: notificationSettingsSelect,
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

  private buildPrivacySettingsUpdateData(
    dto: UpdatePrivacySettingsDto,
  ): Prisma.PrivacySettingsUpdateInput {
    const data: Prisma.PrivacySettingsUpdateInput = {};

    if (dto.profileVisibilityMode !== undefined) {
      data.profileVisibilityMode = dto.profileVisibilityMode;
    }

    if (dto.showDistance !== undefined) {
      data.showDistance = dto.showDistance;
    }

    if (dto.showOnlineStatus !== undefined) {
      data.showOnlineStatus = dto.showOnlineStatus;
    }

    if (dto.showDisplayNameInPrivateMode !== undefined) {
      data.showDisplayNameInPrivateMode = dto.showDisplayNameInPrivateMode;
    }

    if (dto.showBioInPrivateMode !== undefined) {
      data.showBioInPrivateMode = dto.showBioInPrivateMode;
    }

    if (dto.showLocationInPrivateMode !== undefined) {
      data.showLocationInPrivateMode = dto.showLocationInPrivateMode;
    }

    if (dto.discoverable !== undefined) {
      data.discoverable = dto.discoverable;
    }

    if (dto.allowMessagesFromMatchesOnly !== undefined) {
      data.allowMessagesFromMatchesOnly = dto.allowMessagesFromMatchesOnly;
    }

    return data;
  }

  private buildNotificationSettingsUpdateData(
    dto: UpdateNotificationSettingsDto,
  ): Prisma.NotificationSettingsUpdateInput {
    const data: Prisma.NotificationSettingsUpdateInput = {};

    if (dto.likesEnabled !== undefined) {
      data.likesEnabled = dto.likesEnabled;
    }

    if (dto.matchesEnabled !== undefined) {
      data.matchesEnabled = dto.matchesEnabled;
    }

    if (dto.messagesEnabled !== undefined) {
      data.messagesEnabled = dto.messagesEnabled;
    }

    if (dto.productUpdatesEnabled !== undefined) {
      data.productUpdatesEnabled = dto.productUpdatesEnabled;
    }

    return data;
  }
}
