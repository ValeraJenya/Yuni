export const PROFILE_PHOTO_UPLOAD_DIR = 'uploads/profile-photos';
export const PROFILE_PHOTO_PUBLIC_PATH = '/uploads/profile-photos';
export const PROFILE_PHOTO_STORAGE_PREFIX = 'profile-photos/';
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_PHOTO_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
