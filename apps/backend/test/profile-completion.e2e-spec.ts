import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
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

interface CompletionResponse {
  profile: {
    completion: {
      isComplete: boolean;
      missingFields: string[];
      percentage: number;
    };
  };
}

interface PhotoMutationResponse extends CompletionResponse {
  photo: {
    id: string;
    publicUrl: string | null;
    moderationStatus: string;
    publishedAt: string | null;
  };
}

interface DiscoveryResponse {
  cards: Array<{
    userId: string;
  }>;
}

describe('profile completion lifecycle (PostgreSQL e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let profilePhotoStorage: ProfilePhotoStorage;
  let baseUrl: string;
  const createdUserIds: string[] = [];
  const uploadedPhotos: Array<{ token: string; photoId: string }> = [];

  beforeAll(async () => {
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: false,
      abortOnError: false,
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

  it('keeps self completion and discovery eligibility synchronized', async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userA = await register(`task021_a_${suffix}`, `task021-a-${suffix}@example.test`);
    createdUserIds.push(userA.user.id);
    const userB = await register(`task021_b_${suffix}`, `task021-b-${suffix}@example.test`);
    createdUserIds.push(userB.user.id);

    await expect(
      prisma.profile.update({
        where: { userId: userA.user.id },
        data: { bio: '\t\r\n' },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.profile.update({
        where: { userId: userA.user.id },
        data: { displayName: '\u00a0\u2003\ufeff' },
      }),
    ).rejects.toThrow();

    const initialA = await requestJson<CompletionResponse>('/profiles/me', {
      headers: authorization(userA.accessToken),
    });
    expect(initialA.profile.completion).toEqual({
      isComplete: false,
      missingFields: ['bio', 'gender', 'lookingFor', 'city', 'country', 'photo'],
      percentage: 25,
    });

    await completeFields(userA.accessToken);
    await completeFields(userB.accessToken);

    const photoA = await uploadPhoto(userA.accessToken);
    uploadedPhotos.push({ token: userA.accessToken, photoId: photoA.photo.id });
    const photoB = await uploadPhoto(userB.accessToken);
    uploadedPhotos.push({ token: userB.accessToken, photoId: photoB.photo.id });

    for (const upload of [photoA, photoB]) {
      expect(upload.photo).toMatchObject({
        moderationStatus: 'approved',
      });
      expect(upload.photo.publicUrl).not.toBeNull();
      expect(upload.photo.publishedAt).not.toBeNull();
      expect(upload.profile.completion).toEqual({
        isComplete: true,
        missingFields: [],
        percentage: 100,
      });
    }

    await expectDiscovery(userA.accessToken, userB.user.id, userA.user.id, true);
    await expectDiscovery(userB.accessToken, userA.user.id, userB.user.id, true);

    const missingBio = await updateProfile(userB.accessToken, { bio: '' });
    expect(missingBio.profile.completion).toEqual({
      isComplete: false,
      missingFields: ['bio'],
      percentage: 88,
    });
    await expectDiscovery(userA.accessToken, userB.user.id, userA.user.id, false);

    await updateProfile(userB.accessToken, { bio: 'Restored profile bio' });
    await expectDiscovery(userA.accessToken, userB.user.id, userA.user.id, true);

    await requestJson(`/media/profile-photos/${photoB.photo.id}`, {
      method: 'DELETE',
      headers: authorization(userB.accessToken),
    });
    uploadedPhotos.splice(
      uploadedPhotos.findIndex((entry) => entry.photoId === photoB.photo.id),
      1,
    );
    const noPhoto = await requestJson<CompletionResponse>('/profiles/me', {
      headers: authorization(userB.accessToken),
    });
    expect(noPhoto.profile.completion).toMatchObject({
      isComplete: false,
      missingFields: ['photo'],
      percentage: 88,
    });
    await expectDiscovery(userA.accessToken, userB.user.id, userA.user.id, false);

    const replacementPhoto = await uploadPhoto(userB.accessToken);
    uploadedPhotos.push({
      token: userB.accessToken,
      photoId: replacementPhoto.photo.id,
    });
    await expectDiscovery(userA.accessToken, userB.user.id, userA.user.id, true);

    const hiddenProfile = await updateProfile(userB.accessToken, {
      isDiscoverable: false,
    });
    expect(hiddenProfile.profile.completion.isComplete).toBe(true);
    await expectDiscovery(userA.accessToken, userB.user.id, userA.user.id, false);
    await updateProfile(userB.accessToken, { isDiscoverable: true });

    await prisma.privacySettings.update({
      where: { userId: userB.user.id },
      data: { profileVisibilityMode: 'private' },
    });
    await expectDiscovery(userA.accessToken, userB.user.id, userA.user.id, false);
    expect(
      (await requestJson<CompletionResponse>('/profiles/me', {
        headers: authorization(userB.accessToken),
      })).profile.completion.isComplete,
    ).toBe(true);

    await prisma.privacySettings.update({
      where: { userId: userB.user.id },
      data: {
        profileVisibilityMode: 'open',
        discoverable: false,
      },
    });
    await expectDiscovery(userA.accessToken, userB.user.id, userA.user.id, false);

    await prisma.privacySettings.update({
      where: { userId: userB.user.id },
      data: { discoverable: true },
    });
    await expectDiscovery(userA.accessToken, userB.user.id, userA.user.id, true);
  });

  async function register(handle: string, email: string): Promise<AuthResponse> {
    return requestJson<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Synthetic-password-021',
        handle,
        displayName: handle,
        birthDate: '1995-05-15',
      }),
    });
  }

  async function completeFields(token: string): Promise<void> {
    const response = await updateProfile(token, {
      bio: 'Synthetic profile bio',
      gender: 'woman',
      lookingFor: 'relationship',
      city: 'Test City',
      country: 'TC',
    });

    expect(response.profile.completion).toEqual({
      isComplete: false,
      missingFields: ['photo'],
      percentage: 88,
    });
  }

  function updateProfile(
    token: string,
    body: Record<string, unknown>,
  ): Promise<CompletionResponse> {
    return requestJson<CompletionResponse>('/profiles/me', {
      method: 'PATCH',
      headers: {
        ...authorization(token),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
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
    otherUserId: string,
    selfUserId: string,
    shouldIncludeOther: boolean,
  ): Promise<void> {
    const response = await requestJson<DiscoveryResponse>('/discovery/cards', {
      headers: authorization(token),
    });
    const userIds = response.cards.map((card) => card.userId);

    expect(userIds).not.toContain(selfUserId);
    if (shouldIncludeOther) {
      expect(userIds).toContain(otherUserId);
    } else {
      expect(userIds).not.toContain(otherUserId);
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
