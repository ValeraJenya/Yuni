import type { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  PROFILE_PHOTO_PUBLIC_PATH,
  PROFILE_PHOTO_STORAGE_PREFIX,
  PROFILE_PHOTO_UPLOAD_DIR,
} from '../../src/modules/media/media.constants';
import { PROFILE_COMPLETION_FIELDS } from '../../src/modules/profiles/profile-completion.policy';
import { PERSONAS, personaEmail, SEED_PASSWORD, type SeedPersona } from './personas';

const ASSETS_PHOTO_DIR = join(__dirname, 'assets', 'photos');

export async function seedUsers(
  prisma: PrismaClient,
): Promise<Map<string, SeedPersona>> {
  assertPersonasSatisfyCompletionPolicy();

  const passwordHash = await argon2.hash(SEED_PASSWORD);
  const uploadDir = resolve(process.cwd(), PROFILE_PHOTO_UPLOAD_DIR);
  await mkdir(uploadDir, { recursive: true });

  const personaByKey = new Map<string, SeedPersona>();

  for (const persona of PERSONAS) {
    await upsertUserAndProfile(prisma, persona, passwordHash);
    await upsertProfilePhoto(prisma, persona, uploadDir);
    personaByKey.set(persona.key, persona);
  }

  return personaByKey;
}

// PROFILE_COMPLETION_FIELDS is the actual gate Discovery uses. If a future
// change adds a required scalar field, seeded personas must keep filling it —
// this check fails loudly instead of quietly shipping half-visible demo
// profiles ("photo" is handled separately by upsertProfilePhoto).
function assertPersonasSatisfyCompletionPolicy(): void {
  const requiredScalarFields = PROFILE_COMPLETION_FIELDS.filter(
    (field) => field !== 'photo',
  );

  for (const persona of PERSONAS) {
    for (const field of requiredScalarFields) {
      const value = (persona as unknown as Record<string, unknown>)[field];

      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(
          `Seed persona "${persona.key}" is missing a non-empty "${field}" required by profile-completion.policy.ts.`,
        );
      }
    }
  }
}

async function upsertUserAndProfile(
  prisma: PrismaClient,
  persona: SeedPersona,
  passwordHash: string,
): Promise<void> {
  const email = personaEmail(persona);

  await prisma.user.upsert({
    where: { id: persona.id },
    update: {
      email,
      passwordHash,
      status: 'active',
      deletedAt: null,
    },
    create: {
      id: persona.id,
      email,
      passwordHash,
      status: 'active',
    },
  });

  const profileData = {
    handle: persona.handle,
    displayName: persona.displayName,
    birthDate: new Date(`${persona.birthDate}T00:00:00.000Z`),
    bio: persona.bio,
    gender: persona.gender,
    lookingFor: persona.lookingFor,
    city: persona.city,
    country: persona.country,
    isDiscoverable: true,
  };

  await prisma.profile.upsert({
    where: { userId: persona.id },
    update: profileData,
    create: {
      userId: persona.id,
      ...profileData,
    },
  });

  await prisma.privacySettings.upsert({
    where: { userId: persona.id },
    update: {},
    create: { userId: persona.id },
  });

  await prisma.notificationSettings.upsert({
    where: { userId: persona.id },
    update: {},
    create: { userId: persona.id },
  });
}

async function upsertProfilePhoto(
  prisma: PrismaClient,
  persona: SeedPersona,
  uploadDir: string,
): Promise<void> {
  const filename = `${persona.photoId}.png`;
  const storageKey = `${PROFILE_PHOTO_STORAGE_PREFIX}${filename}`;
  const publicUrl = `${PROFILE_PHOTO_PUBLIC_PATH}/${filename}`;

  await copyFile(join(ASSETS_PHOTO_DIR, `${persona.key}.png`), join(uploadDir, filename));

  const now = new Date();

  await prisma.profilePhoto.upsert({
    where: { storageKey },
    update: {
      userId: persona.id,
      publicUrl,
      mimeType: 'image/png',
      position: 0,
      isPrimary: true,
      moderationStatus: 'approved',
      approvedAt: now,
      rejectedAt: null,
      publishedAt: now,
    },
    create: {
      userId: persona.id,
      storageKey,
      publicUrl,
      mimeType: 'image/png',
      position: 0,
      isPrimary: true,
      moderationStatus: 'approved',
      approvedAt: now,
      publishedAt: now,
    },
  });
}
