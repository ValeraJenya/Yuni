import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import {
  PROFILE_PHOTO_PUBLIC_PATH,
  PROFILE_PHOTO_STORAGE_PREFIX,
  PROFILE_PHOTO_UPLOAD_DIR,
} from '../media.constants';
import type {
  ProfilePhotoStorage,
  SaveProfilePhotoInput,
  SaveProfilePhotoResult,
} from './profile-photo-storage.port';

const profilePhotoFilenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

@Injectable()
export class LocalProfilePhotoStorageService implements ProfilePhotoStorage {
  async saveProfilePhoto(
    input: SaveProfilePhotoInput,
  ): Promise<SaveProfilePhotoResult> {
    const extension = this.getExtensionForMimeType(input.mimeType);
    const filename = `${randomUUID()}${extension}`;
    const storageKey = `${PROFILE_PHOTO_STORAGE_PREFIX}${filename}`;
    const publicUrl = `${PROFILE_PHOTO_PUBLIC_PATH}/${filename}`;
    const uploadDir = this.getUploadDir();

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), input.buffer);

    return {
      storageKey,
      publicUrl,
    };
  }

  async deleteProfilePhoto(storageKey: string): Promise<void> {
    const filePath = this.getPhotoFilePath(storageKey);

    if (!filePath) {
      return;
    }

    await unlink(filePath);
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
        throw new Error('Unsupported profile photo MIME type');
    }
  }

  private getUploadDir(): string {
    return resolve(process.cwd(), PROFILE_PHOTO_UPLOAD_DIR);
  }

  private getPhotoFilePath(storageKey: string): string | null {
    if (!storageKey.startsWith(PROFILE_PHOTO_STORAGE_PREFIX)) {
      return null;
    }

    const filename = storageKey.slice(PROFILE_PHOTO_STORAGE_PREFIX.length);

    if (filename !== basename(filename)) {
      return null;
    }

    if (!profilePhotoFilenamePattern.test(filename)) {
      return null;
    }

    const uploadDir = this.getUploadDir();
    const filePath = resolve(uploadDir, filename);

    if (!this.isWithinDirectory(filePath, uploadDir)) {
      return null;
    }

    return filePath;
  }

  private isWithinDirectory(filePath: string, directory: string): boolean {
    const relativePath = relative(directory, filePath);

    return (
      relativePath.length > 0 &&
      !relativePath.startsWith('..') &&
      !isAbsolute(relativePath)
    );
  }
}