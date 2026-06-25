import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  PROFILE_PHOTO_PUBLIC_PATH,
  PROFILE_PHOTO_STORAGE_PREFIX,
  PROFILE_PHOTO_UPLOAD_DIR,
} from '../media.constants';
import { LocalProfilePhotoStorageService } from './local-profile-photo-storage.service';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => '11111111-1111-4111-8111-111111111111'),
}));

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn(async () => undefined),
  writeFile: jest.fn(async () => undefined),
  unlink: jest.fn(async () => undefined),
}));

describe('LocalProfilePhotoStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(randomUUID).mockReturnValue(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('saves profile photos under a generated storage key and public URL', async () => {
    const service = createService();
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const uploadDir = resolve(process.cwd(), PROFILE_PHOTO_UPLOAD_DIR);
    const filename = '11111111-1111-4111-8111-111111111111.png';

    const result = await service.saveProfilePhoto({
      buffer,
      mimeType: 'image/png',
    });

    expect(mkdir).toHaveBeenCalledWith(uploadDir, { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(join(uploadDir, filename), buffer);
    expect(result).toEqual({
      storageKey: `${PROFILE_PHOTO_STORAGE_PREFIX}${filename}`,
      publicUrl: `${PROFILE_PHOTO_PUBLIC_PATH}/${filename}`,
    });
  });

  it('rejects unsupported MIME types before touching local storage', async () => {
    const service = createService();

    await expect(
      service.saveProfilePhoto({
        buffer: Buffer.from([0x47, 0x49, 0x46]),
        mimeType: 'image/gif',
      }),
    ).rejects.toThrow('Unsupported profile photo MIME type');

    expect(randomUUID).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('deletes a valid profile photo storage key inside the upload directory', async () => {
    const service = createService();
    const uploadDir = resolve(process.cwd(), PROFILE_PHOTO_UPLOAD_DIR);
    const storageKey = `${PROFILE_PHOTO_STORAGE_PREFIX}11111111-1111-4111-8111-111111111111.jpg`;

    await service.deleteProfilePhoto(storageKey);

    expect(unlink).toHaveBeenCalledWith(
      join(uploadDir, '11111111-1111-4111-8111-111111111111.jpg'),
    );
  });

  it.each([
    'other-prefix/11111111-1111-4111-8111-111111111111.jpg',
    `${PROFILE_PHOTO_STORAGE_PREFIX}../other-file.jpg`,
    `${PROFILE_PHOTO_STORAGE_PREFIX}nested/11111111-1111-4111-8111-111111111111.jpg`,
    `${PROFILE_PHOTO_STORAGE_PREFIX}11111111-1111-4111-8111-111111111111.gif`,
    `${PROFILE_PHOTO_STORAGE_PREFIX}not-a-uuid.jpg`,
    resolve(
      process.cwd(),
      PROFILE_PHOTO_UPLOAD_DIR,
      '11111111-1111-4111-8111-111111111111.jpg',
    ),
  ])('does not delete invalid storage key %s', async (storageKey) => {
    const service = createService();

    await service.deleteProfilePhoto(storageKey);

    expect(unlink).not.toHaveBeenCalled();
  });
});

function createService(): LocalProfilePhotoStorageService {
  return new LocalProfilePhotoStorageService();
}