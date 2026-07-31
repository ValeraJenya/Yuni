import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ProfileVisibilityMode, UserStatus } from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { SettingsService } from './settings.service';

const CURRENT_USER: AuthenticatedUser = {
  id: 'user-1',
  email: 'person@example.com',
};

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
  };
  privacySettings: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  notificationSettings: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
}

describe('SettingsService', () => {
  it('returns current privacy and notification settings without internal fields', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.privacySettings.findUnique.mockResolvedValue(makePrivacySettings());
    prisma.notificationSettings.findUnique.mockResolvedValue(
      makeNotificationSettings(),
    );

    await expect(service.getPrivacySettings(CURRENT_USER)).resolves.toEqual({
      privacySettings: makePrivacySettings(),
    });
    await expect(service.getNotificationSettings(CURRENT_USER)).resolves.toEqual({
      notificationSettings: makeNotificationSettings(),
    });

    expect(prisma.privacySettings.findUnique).toHaveBeenCalledWith({
      where: { userId: CURRENT_USER.id },
      select: expect.not.objectContaining({ anonymousAvatarKey: true }),
    });
  });

  it('updates only provided privacy settings fields', async () => {
    const { service, prisma } = createService();
    const existing = makePrivacySettings();
    const updated = makePrivacySettings({
      profileVisibilityMode: ProfileVisibilityMode.private,
      discoverable: false,
      showBioInPrivateMode: true,
    });
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.privacySettings.findUnique.mockResolvedValue(existing);
    prisma.privacySettings.update.mockResolvedValue(updated);

    const result = await service.updatePrivacySettings(CURRENT_USER, {
      profileVisibilityMode: ProfileVisibilityMode.private,
      discoverable: false,
      showBioInPrivateMode: true,
    });

    expect(prisma.privacySettings.update).toHaveBeenCalledWith({
      where: { userId: CURRENT_USER.id },
      data: {
        profileVisibilityMode: ProfileVisibilityMode.private,
        discoverable: false,
        showBioInPrivateMode: true,
      },
      select: expect.any(Object),
    });
    expect(result).toEqual({ privacySettings: updated });
  });

  it('updates only provided notification settings fields', async () => {
    const { service, prisma } = createService();
    const existing = makeNotificationSettings();
    const updated = makeNotificationSettings({
      matchesEnabled: false,
      productUpdatesEnabled: true,
    });
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.notificationSettings.findUnique.mockResolvedValue(existing);
    prisma.notificationSettings.update.mockResolvedValue(updated);

    const result = await service.updateNotificationSettings(CURRENT_USER, {
      matchesEnabled: false,
      productUpdatesEnabled: true,
    });

    expect(prisma.notificationSettings.update).toHaveBeenCalledWith({
      where: { userId: CURRENT_USER.id },
      data: {
        matchesEnabled: false,
        productUpdatesEnabled: true,
      },
      select: expect.any(Object),
    });
    expect(result).toEqual({ notificationSettings: updated });
  });

  it('does not issue update queries for empty patch DTOs', async () => {
    const { service, prisma } = createService();
    const privacySettings = makePrivacySettings();
    const notificationSettings = makeNotificationSettings();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.privacySettings.findUnique.mockResolvedValue(privacySettings);
    prisma.notificationSettings.findUnique.mockResolvedValue(notificationSettings);

    await expect(service.updatePrivacySettings(CURRENT_USER, {})).resolves.toEqual({
      privacySettings,
    });
    await expect(
      service.updateNotificationSettings(CURRENT_USER, {}),
    ).resolves.toEqual({
      notificationSettings,
    });

    expect(prisma.privacySettings.update).not.toHaveBeenCalled();
    expect(prisma.notificationSettings.update).not.toHaveBeenCalled();
  });

  it('rejects missing, disabled, and deleted users', async () => {
    const { service, prisma } = createService();

    for (const user of [
      null,
      { status: UserStatus.disabled, deletedAt: null },
      { status: UserStatus.active, deletedAt: new Date('2026-01-01T00:00:00.000Z') },
    ]) {
      prisma.user.findUnique.mockResolvedValueOnce(user);

      await expect(service.getPrivacySettings(CURRENT_USER)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    }

    expect(prisma.privacySettings.findUnique).not.toHaveBeenCalled();
  });

  it('returns not found when a guaranteed settings row is missing', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.privacySettings.findUnique.mockResolvedValue(null);

    await expect(service.getPrivacySettings(CURRENT_USER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

function createService() {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    privacySettings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notificationSettings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    service: new SettingsService(prisma as unknown as PrismaService),
    prisma,
  };
}

function activeUser() {
  return {
    status: UserStatus.active,
    deletedAt: null,
  };
}

function makePrivacySettings(overrides = {}) {
  return {
    profileVisibilityMode: ProfileVisibilityMode.open,
    showDistance: true,
    showOnlineStatus: false,
    showDisplayNameInPrivateMode: false,
    showBioInPrivateMode: false,
    showLocationInPrivateMode: false,
    discoverable: true,
    allowMessagesFromMatchesOnly: true,
    ...overrides,
  };
}

function makeNotificationSettings(overrides = {}) {
  return {
    likesEnabled: true,
    matchesEnabled: true,
    messagesEnabled: true,
    productUpdatesEnabled: false,
    ...overrides,
  };
}
