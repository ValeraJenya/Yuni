import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PhotoModerationStatus, Prisma, UserStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  assertFound,
  assertOwner,
} from '../../common/security/access-control';
import {
  toSelfProfile,
  toSelfProfilePhoto,
  type SelfProfilePhotoView,
  type SelfProfileView,
} from '../../common/serializers';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  PROFILE_PHOTO_ALLOWED_MIME_TYPES,
  PROFILE_PHOTO_MAX_BYTES,
  PROFILE_PHOTO_MAX_COUNT,
  PROFILE_PHOTO_PUBLIC_PATH,
  PROFILE_PHOTO_STORAGE_PREFIX,
  PROFILE_PHOTO_UPLOAD_DIR,
} from './media.constants';
import type { UploadedProfilePhotoFile } from './types/uploaded-profile-photo-file';

const selfProfileInclude = {
  photos: true,
} satisfies Prisma.ProfileInclude;

type SelfProfileRecord = Prisma.ProfileGetPayload<{
  include: typeof selfProfileInclude;
}>;

type ProfilePhotoRecord = Prisma.ProfilePhotoGetPayload<Record<string, never>>;

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfilePhotos(
    currentUser: AuthenticatedUser,
  ): Promise<{ photos: SelfProfilePhotoView[] }> {
    await this.assertActiveUser(currentUser.id);

    const photos = await this.findSelfPhotos(currentUser.id);

    return {
      photos: photos.map(toSelfProfilePhoto),
    };
  }

  async uploadProfilePhoto(
    currentUser: AuthenticatedUser,
    file: UploadedProfilePhotoFile | undefined,
  ): Promise<{ profile: SelfProfileView; photo: SelfProfilePhotoView }> {
    await this.assertActiveUser(currentUser.id);
    this.assertValidProfilePhotoFile(file);

    const existingPhotoCount = await this.prisma.profilePhoto.count({
      where: { userId: currentUser.id },
    });

    if (existingPhotoCount >= PROFILE_PHOTO_MAX_COUNT) {
      throw new BadRequestException('Profile photo limit has been reached');
    }

    const now = new Date();
    const extension = this.getExtensionForMimeType(file.mimetype);
    const filename = `${randomUUID()}${extension}`;
    const storageKey = `${PROFILE_PHOTO_STORAGE_PREFIX}${filename}`;
    const publicUrl = `${PROFILE_PHOTO_PUBLIC_PATH}/${filename}`;
    const uploadDir = this.getUploadDir();

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), file.buffer);

    try {
      const photo = await this.prisma.$transaction(async (tx) => {
        const [photoCount, positionAggregate] = await Promise.all([
          tx.profilePhoto.count({
            where: { userId: currentUser.id },
          }),
          tx.profilePhoto.aggregate({
            where: { userId: currentUser.id },
            _max: { position: true },
          }),
        ]);

        if (photoCount >= PROFILE_PHOTO_MAX_COUNT) {
          throw new BadRequestException('Profile photo limit has been reached');
        }

        const isFirstPhoto = photoCount === 0;
        const nextPosition = (positionAggregate._max.position ?? -1) + 1;

        return tx.profilePhoto.create({
          data: {
            userId: currentUser.id,
            storageKey,
            publicUrl,
            mimeType: file.mimetype,
            position: nextPosition,
            isPrimary: isFirstPhoto,
            moderationStatus: PhotoModerationStatus.approved,
            approvedAt: now,
            publishedAt: now,
          },
        });
      });

      return {
        profile: await this.getSelfProfileView(currentUser.id),
        photo: toSelfProfilePhoto(photo),
      };
    } catch (error) {
      await this.unlinkStorageKeyBestEffort(storageKey);
      throw error;
    }
  }

  async setProfilePhotoPrimary(
    currentUser: AuthenticatedUser,
    photoId: string,
  ): Promise<{ profile: SelfProfileView; photos: SelfProfilePhotoView[] }> {
    await this.assertActiveUser(currentUser.id);

    const photo = await this.prisma.profilePhoto.findUnique({
      where: { id: photoId },
    });
    assertFound(photo);
    assertOwner(photo.userId, currentUser.id);

    await this.prisma.$transaction([
      this.prisma.profilePhoto.updateMany({
        where: {
          userId: currentUser.id,
          isPrimary: true,
        },
        data: { isPrimary: false },
      }),
      this.prisma.profilePhoto.update({
        where: { id: photoId },
        data: { isPrimary: true },
      }),
    ]);

    const [profile, photos] = await Promise.all([
      this.getSelfProfileView(currentUser.id),
      this.findSelfPhotos(currentUser.id),
    ]);

    return {
      profile,
      photos: photos.map(toSelfProfilePhoto),
    };
  }

  async deleteProfilePhoto(
    currentUser: AuthenticatedUser,
    photoId: string,
  ): Promise<{ success: true; profile: SelfProfileView; photos: SelfProfilePhotoView[] }> {
    await this.assertActiveUser(currentUser.id);

    const photo = await this.prisma.profilePhoto.findUnique({
      where: { id: photoId },
    });
    assertFound(photo);
    assertOwner(photo.userId, currentUser.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.profilePhoto.delete({
        where: { id: photoId },
      });

      if (!photo.isPrimary) {
        return;
      }

      const nextPrimary = await tx.profilePhoto.findFirst({
        where: { userId: currentUser.id },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      });

      if (nextPrimary) {
        await tx.profilePhoto.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true },
        });
      }
    });

    await this.unlinkStorageKeyBestEffort(photo.storageKey);

    const [profile, photos] = await Promise.all([
      this.getSelfProfileView(currentUser.id),
      this.findSelfPhotos(currentUser.id),
    ]);

    return {
      success: true,
      profile,
      photos: photos.map(toSelfProfilePhoto),
    };
  }

  private assertValidProfilePhotoFile(
    file: UploadedProfilePhotoFile | undefined,
  ): asserts file is UploadedProfilePhotoFile {
    if (!file?.buffer || file.size <= 0) {
      throw new BadRequestException('Profile photo file is required');
    }

    if (!PROFILE_PHOTO_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Profile photo must be a JPEG, PNG or WebP image',
      );
    }

    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      throw new BadRequestException('Profile photo must be 5 MB or smaller');
    }

    if (!this.hasExpectedImageSignature(file.mimetype, file.buffer)) {
      throw new BadRequestException(
        'Profile photo must be a valid JPEG, PNG or WebP image',
      );
    }
  }

  private hasExpectedImageSignature(
    mimeType: string,
    buffer: Buffer,
  ): boolean {
    switch (mimeType) {
      case 'image/jpeg':
        return (
          buffer.length >= 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff
        );
      case 'image/png':
        return (
          buffer.length >= 8 &&
          buffer.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          )
        );
      case 'image/webp':
        return (
          buffer.length >= 12 &&
          buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
          buffer.subarray(8, 12).toString('ascii') === 'WEBP'
        );
      default:
        return false;
    }
  }

  private getExtensionForMimeType(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        throw new BadRequestException(
          'Profile photo must be a JPEG, PNG or WebP image',
        );
    }
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

  private async findSelfPhotos(userId: string): Promise<ProfilePhotoRecord[]> {
    return this.prisma.profilePhoto.findMany({
      where: { userId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private async getSelfProfileView(userId: string): Promise<SelfProfileView> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: selfProfileInclude,
    });

    assertFound(profile);

    return toSelfProfile(this.sortProfilePhotos(profile));
  }

  private sortProfilePhotos(profile: SelfProfileRecord): SelfProfileRecord {
    return {
      ...profile,
      photos: [...profile.photos].sort(
        (left, right) =>
          left.position - right.position ||
          left.createdAt.getTime() - right.createdAt.getTime(),
      ),
    };
  }

  private getUploadDir(): string {
    return join(process.cwd(), PROFILE_PHOTO_UPLOAD_DIR);
  }

  private getPhotoFilePath(storageKey: string): string | null {
    if (!storageKey.startsWith(PROFILE_PHOTO_STORAGE_PREFIX)) {
      return null;
    }

    const filename = storageKey.slice(PROFILE_PHOTO_STORAGE_PREFIX.length);

    if (filename !== basename(filename)) {
      return null;
    }

    if (!/^[0-9a-f-]+\.(jpg|png|webp)$/.test(filename)) {
      return null;
    }

    return join(this.getUploadDir(), filename);
  }

  private async unlinkStorageKeyBestEffort(storageKey: string): Promise<void> {
    const filePath = this.getPhotoFilePath(storageKey);

    if (!filePath) {
      return;
    }

    try {
      await unlink(filePath);
    } catch {
      // Local MVP storage cleanup should not turn a successful DB change into 500.
    }
  }
}
