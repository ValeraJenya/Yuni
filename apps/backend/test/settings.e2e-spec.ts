import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { NotificationType } from '@prisma/client';
import type { AddressInfo } from 'node:net';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/common/prisma/prisma.service';
import {
  PROFILE_PHOTO_STORAGE,
  type ProfilePhotoStorage,
} from '../src/modules/media/storage/profile-photo-storage.port';

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
  };
}

interface PrivacySettingsResponse {
  privacySettings: {
    profileVisibilityMode: string;
    showDistance: boolean;
    showOnlineStatus: boolean;
    showDisplayNameInPrivateMode: boolean;
    showBioInPrivateMode: boolean;
    showLocationInPrivateMode: boolean;
    discoverable: boolean;
    allowMessagesFromMatchesOnly: boolean;
  };
}

interface NotificationSettingsResponse {
  notificationSettings: {
    likesEnabled: boolean;
    matchesEnabled: boolean;
    messagesEnabled: boolean;
    productUpdatesEnabled: boolean;
  };
}

interface DiscoveryResponse {
  cards: Array<{
    userId: string;
  }>;
}

interface LikeResponse {
  match?: {
    id: string;
  };
}

interface PhotoMutationResponse {
  photo: {
    id: string;
  };
}

describe('settings API (PostgreSQL e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let profilePhotoStorage: ProfilePhotoStorage;
  let baseUrl: string;
  const createdUserIds: string[] = [];
  const uploadedPhotos: Array<{ token: string; photoId: string }> = [];

  beforeAll(async () => {
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: false,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1');

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
    prisma = app.get(PrismaService);
    profilePhotoStorage = app.get(PROFILE_PHOTO_STORAGE);
  });

  afterAll(async () => {
    const storedPhotos =
      createdUserIds.length > 0
        ? await prisma.profilePhoto.findMany({
            where: { userId: { in: createdUserIds } },
            select: { storageKey: true },
          })
        : [];

    try {
      for (const { token, photoId } of uploadedPhotos) {
        await fetch(`${baseUrl}/media/profile-photos/${photoId}`, {
          method: 'DELETE',
          headers: authorization(token),
        }).catch(() => undefined);
      }
    } finally {
      for (const { storageKey } of storedPhotos) {
        await profilePhotoStorage
          .deleteProfilePhoto(storageKey)
          .catch(() => undefined);
      }

      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: {
            id: { in: createdUserIds },
          },
        });
      }

      await app.close();
    }
  });

  it('returns registration defaults and persists privacy settings into discovery enforcement', async () => {
    const viewer = await register('settings_viewer');
    const target = await register('settings_target');
    await completeDiscoverableProfile(viewer);
    await completeDiscoverableProfile(target);

    const initialPrivacy = await requestJson<PrivacySettingsResponse>(
      '/settings/privacy',
      { headers: authorization(target.accessToken) },
    );
    expect(initialPrivacy.privacySettings).toEqual({
      profileVisibilityMode: 'open',
      showDistance: true,
      showOnlineStatus: false,
      showDisplayNameInPrivateMode: false,
      showBioInPrivateMode: false,
      showLocationInPrivateMode: false,
      discoverable: true,
      allowMessagesFromMatchesOnly: true,
    });
    expect(initialPrivacy.privacySettings).not.toHaveProperty(
      'anonymousAvatarKey',
    );

    await expectDiscovery(viewer.accessToken, target.user.id, true);
    const updatedPrivacy = await requestJson<PrivacySettingsResponse>(
      '/settings/privacy',
      {
        method: 'PATCH',
        headers: {
          ...authorization(target.accessToken),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ discoverable: false }),
      },
    );

    expect(updatedPrivacy.privacySettings).toMatchObject({
      discoverable: false,
      profileVisibilityMode: 'open',
    });
    await expectDiscovery(viewer.accessToken, target.user.id, false);
  });

  it('returns registration defaults and persists notification settings into match notification enforcement', async () => {
    const userA = await register('settings_match_a');
    const userB = await register('settings_match_b');

    const initialNotifications =
      await requestJson<NotificationSettingsResponse>(
        '/settings/notifications',
        { headers: authorization(userB.accessToken) },
      );
    expect(initialNotifications.notificationSettings).toEqual({
      likesEnabled: true,
      matchesEnabled: true,
      messagesEnabled: true,
      productUpdatesEnabled: false,
    });

    const updatedNotifications =
      await requestJson<NotificationSettingsResponse>(
        '/settings/notifications',
        {
          method: 'PATCH',
          headers: {
            ...authorization(userB.accessToken),
            'content-type': 'application/json',
          },
          body: JSON.stringify({ matchesEnabled: false }),
        },
      );
    expect(updatedNotifications.notificationSettings).toMatchObject({
      matchesEnabled: false,
    });

    await requestJson<LikeResponse>(`/likes/${userB.user.id}`, {
      method: 'POST',
      headers: authorization(userA.accessToken),
    });
    const reciprocal = await requestJson<LikeResponse>(`/likes/${userA.user.id}`, {
      method: 'POST',
      headers: authorization(userB.accessToken),
    });
    expect(reciprocal.match).toBeDefined();

    await expect(
      prisma.notification.count({
        where: {
          recipientUserId: userB.user.id,
          type: NotificationType.match_created,
        },
      }),
    ).resolves.toBe(0);
    await expect(
      prisma.notification.count({
        where: {
          recipientUserId: userA.user.id,
          type: NotificationType.match_created,
        },
      }),
    ).resolves.toBe(1);
  });

  async function register(label: string): Promise<AuthResponse> {
    const suffix = `${label}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const auth = await requestJson<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: `${suffix}@example.test`,
        password: 'Synthetic-password-057',
        handle: suffix,
        displayName: suffix,
        birthDate: '1995-05-15',
      }),
    });
    createdUserIds.push(auth.user.id);
    return auth;
  }

  async function completeDiscoverableProfile(auth: AuthResponse): Promise<void> {
    await requestJson('/profiles/me', {
      method: 'PATCH',
      headers: {
        ...authorization(auth.accessToken),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        bio: 'Synthetic profile bio',
        gender: 'woman',
        lookingFor: 'relationship',
        city: 'Test City',
        country: 'TC',
      }),
    });
    const photo = await uploadPhoto(auth.accessToken);
    uploadedPhotos.push({ token: auth.accessToken, photoId: photo.photo.id });
  }

  async function uploadPhoto(token: string): Promise<PhotoMutationResponse> {
    const form = new FormData();
    form.append(
      'file',
      new Blob(
        [
          Uint8Array.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
          ]),
        ],
        { type: 'image/png' },
      ),
      'synthetic.png',
    );

    return requestJson<PhotoMutationResponse>('/media/profile-photos', {
      method: 'POST',
      headers: authorization(token),
      body: form,
    });
  }

  async function expectDiscovery(
    token: string,
    targetUserId: string,
    expected: boolean,
  ): Promise<void> {
    const response = await requestJson<DiscoveryResponse>('/discovery/cards', {
      headers: authorization(token),
    });
    const userIds = response.cards.map((card) => card.userId);

    if (expected) {
      expect(userIds).toContain(targetUserId);
    } else {
      expect(userIds).not.toContain(targetUserId);
    }
  }

  async function requestJson<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, init);
    const body = (await response.json()) as T | { message?: string };

    if (!response.ok) {
      throw new Error(
        `Request ${init.method ?? 'GET'} ${path} failed with ${response.status}: ${JSON.stringify(body)}`,
      );
    }

    return body as T;
  }
});

function authorization(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}
