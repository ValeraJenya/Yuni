import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  assertCanAccessProfile,
  assertFound,
} from '../../common/security/access-control';
import {
  toPublicProfile,
  toSelfProfile,
  type PublicProfileView,
  type SelfProfileView,
} from '../../common/serializers';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UpdateProfileDto } from './dto/update-profile.dto';

const selfProfileInclude = {
  photos: true,
} satisfies Prisma.ProfileInclude;

const publicProfileInclude = {
  photos: true,
  user: {
    select: {
      privacySettings: true,
    },
  },
} satisfies Prisma.ProfileInclude;

type SelfProfileRecord = Prisma.ProfileGetPayload<{
  include: typeof selfProfileInclude;
}>;

type PublicProfileRecord = Prisma.ProfileGetPayload<{
  include: typeof publicProfileInclude;
}>;

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(
    currentUser: AuthenticatedUser,
  ): Promise<{ profile: SelfProfileView }> {
    await this.assertActiveUser(currentUser.id);

    const profile = await this.findSelfProfile(currentUser.id);
    assertFound(profile);

    return {
      profile: toSelfProfile(profile),
    };
  }

  async updateMe(
    currentUser: AuthenticatedUser,
    dto: UpdateProfileDto,
  ): Promise<{ profile: SelfProfileView }> {
    await this.assertActiveUser(currentUser.id);

    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId: currentUser.id },
      select: { userId: true },
    });
    assertFound(existingProfile);

    const data = this.buildUpdateData(dto);

    if (Object.keys(data).length === 0) {
      const profile = await this.findSelfProfile(currentUser.id);
      assertFound(profile);

      return {
        profile: toSelfProfile(profile),
      };
    }

    const profile = await this.prisma.profile.update({
      where: { userId: currentUser.id },
      data,
      include: selfProfileInclude,
    });

    return {
      profile: toSelfProfile(profile),
    };
  }

  async getByHandle(
    handle: string,
    currentUser: AuthenticatedUser,
  ): Promise<{ profile: PublicProfileView }> {
    await this.assertActiveUser(currentUser.id);

    const profile = await this.prisma.profile.findFirst({
      where: {
        handle: {
          equals: handle,
          mode: 'insensitive',
        },
      },
      include: publicProfileInclude,
    });
    assertFound(profile);

    assertCanAccessProfile(this.toProfileAccessResource(profile), currentUser.id);

    return {
      profile: toPublicProfile(profile, profile.user.privacySettings),
    };
  }

  private async findSelfProfile(
    userId: string,
  ): Promise<SelfProfileRecord | null> {
    return this.prisma.profile.findUnique({
      where: { userId },
      include: selfProfileInclude,
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

  private buildUpdateData(dto: UpdateProfileDto): Prisma.ProfileUpdateInput {
    const data: Prisma.ProfileUpdateInput = {};

    if (dto.displayName !== undefined) {
      data.displayName = dto.displayName;
    }

    if (dto.bio !== undefined) {
      data.bio = dto.bio;
    }

    if (dto.gender !== undefined) {
      data.gender = dto.gender;
    }

    if (dto.lookingFor !== undefined) {
      data.lookingFor = dto.lookingFor;
    }

    if (dto.city !== undefined) {
      data.city = dto.city;
    }

    if (dto.country !== undefined) {
      data.country = dto.country;
    }

    if (dto.isDiscoverable !== undefined) {
      data.isDiscoverable = dto.isDiscoverable;
    }

    return data;
  }

  private toProfileAccessResource(profile: PublicProfileRecord) {
    return {
      userId: profile.userId,
      isDiscoverable: profile.isDiscoverable,
      privacySettings: profile.user.privacySettings,
    };
  }
}
