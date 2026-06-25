export const PROFILE_PHOTO_STORAGE = Symbol('PROFILE_PHOTO_STORAGE');

export interface SaveProfilePhotoInput {
  buffer: Buffer;
  mimeType: string;
}

export interface SaveProfilePhotoResult {
  storageKey: string;
  publicUrl: string;
}

export interface ProfilePhotoStorage {
  saveProfilePhoto(
    input: SaveProfilePhotoInput,
  ): Promise<SaveProfilePhotoResult>;
  deleteProfilePhoto(storageKey: string): Promise<void>;
}