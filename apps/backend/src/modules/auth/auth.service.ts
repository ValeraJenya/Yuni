import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './types/authenticated-user';
import type { JwtPayload } from './types/jwt-payload';

interface ClientSessionMeta {
  ipAddress?: string;
  userAgent?: string;
}

interface UtcDateParts {
  year: number;
  month: number;
  day: number;
}

interface ParsedBirthDate {
  date: Date;
  parts: UtcDateParts;
}

export interface SafeAuthUser {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  profile: {
    handle: string;
    displayName: string;
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshCookieValue: string;
  refreshExpiresAt: Date;
}

export interface AuthResponse {
  user: SafeAuthUser;
  accessToken: string;
}

const MINIMUM_REGISTRATION_AGE = 18;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, meta: ClientSessionMeta): Promise<AuthResponse & AuthTokens> {
    const email = dto.email.trim().toLowerCase();
    const handle = dto.handle.trim();
    const displayName = dto.displayName.trim();
    const birthDate = this.parseBirthDateOrThrow(dto.birthDate);

    this.assertAdultOrThrow(birthDate.parts);

    await this.ensureEmailAndHandleAvailable(email, handle);

    const passwordHash = await argon2.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          profile: {
            create: {
              handle,
              displayName,
              birthDate: birthDate.date,
            },
          },
          privacySettings: {
            create: {},
          },
          notificationSettings: {
            create: {},
          },
        },
        include: {
          profile: true,
        },
      });

      const tokens = await this.issueTokenPair(user.id, user.email, meta);

      return {
        user: this.toSafeAuthUser(user),
        ...tokens,
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email or handle is already in use');
      }

      throw error;
    }
  }

  async login(dto: LoginDto, meta: ClientSessionMeta): Promise<AuthResponse & AuthTokens> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      include: {
        profile: true,
      },
    });

    if (!user || user.status !== UserStatus.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokenPair(user.id, user.email, meta);

    return {
      user: this.toSafeAuthUser(user),
      ...tokens,
    };
  }

  async refresh(refreshCookieValue: string | undefined, meta: ClientSessionMeta): Promise<AuthResponse & AuthTokens> {
    const session = await this.verifyRefreshCookie(refreshCookieValue);

    await this.prisma.refreshToken.update({
      where: { id: session.refreshTokenId },
      data: {
        revokedAt: new Date(),
        revokedReason: 'rotated',
        lastUsedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    if (!user || user.status !== UserStatus.active || user.deletedAt) {
      throw new UnauthorizedException('Authentication required');
    }

    const tokens = await this.issueTokenPair(user.id, user.email, meta);

    return {
      user: this.toSafeAuthUser(user),
      ...tokens,
    };
  }

  async logout(refreshCookieValue: string | undefined): Promise<{ success: true }> {
    const parsed = this.parseRefreshCookie(refreshCookieValue);

    if (parsed) {
      await this.prisma.refreshToken.updateMany({
        where: {
          id: parsed.refreshTokenId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'logout',
          lastUsedAt: new Date(),
        },
      });
    }

    return { success: true };
  }

  async getMe(currentUser: AuthenticatedUser): Promise<{ user: SafeAuthUser }> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { profile: true },
    });

    if (!user || user.status !== UserStatus.active || user.deletedAt) {
      throw new UnauthorizedException('Authentication required');
    }

    return {
      user: this.toSafeAuthUser(user),
    };
  }

  private async ensureEmailAndHandleAvailable(email: string, handle: string): Promise<void> {
    const [existingUser, existingProfile] = await Promise.all([
      this.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      }),
      this.prisma.profile.findFirst({
        where: {
          handle: {
            equals: handle,
            mode: 'insensitive',
          },
        },
        select: { userId: true },
      }),
    ]);

    if (existingUser || existingProfile) {
      throw new ConflictException('Email or handle is already in use');
    }
  }

  private parseBirthDateOrThrow(value: string): ParsedBirthDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      throw new BadRequestException('birthDate must be in YYYY-MM-DD format');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new BadRequestException('birthDate must be a valid calendar date');
    }

    return {
      date,
      parts: { year, month, day },
    };
  }

  private assertAdultOrThrow(birthDate: UtcDateParts): void {
    const today = this.getTodayUtcDateParts();

    if (this.compareUtcDateParts(birthDate, today) > 0) {
      throw new BadRequestException('birthDate cannot be in the future');
    }

    if (!this.isAtLeastAge(birthDate, today, MINIMUM_REGISTRATION_AGE)) {
      throw new BadRequestException('You must be at least 18 years old to register');
    }
  }

  private getTodayUtcDateParts(): UtcDateParts {
    const today = new Date();

    return {
      year: today.getUTCFullYear(),
      month: today.getUTCMonth() + 1,
      day: today.getUTCDate(),
    };
  }

  private isAtLeastAge(
    birthDate: UtcDateParts,
    today: UtcDateParts,
    minimumAge: number,
  ): boolean {
    let age = today.year - birthDate.year;

    if (
      today.month < birthDate.month ||
      (today.month === birthDate.month && today.day < birthDate.day)
    ) {
      age -= 1;
    }

    return age >= minimumAge;
  }

  private compareUtcDateParts(left: UtcDateParts, right: UtcDateParts): number {
    if (left.year !== right.year) {
      return left.year - right.year;
    }

    if (left.month !== right.month) {
      return left.month - right.month;
    }

    return left.day - right.day;
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    meta: ClientSessionMeta,
  ): Promise<AuthTokens> {
    const accessToken = await this.signAccessToken(userId, email);
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshExpiresAt = this.getRefreshExpiryDate();
    const tokenHash = await argon2.hash(refreshToken);

    const refreshTokenRow = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: refreshExpiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      select: {
        id: true,
      },
    });

    return {
      accessToken,
      refreshCookieValue: `${refreshTokenRow.id}.${refreshToken}`,
      refreshExpiresAt,
    };
  }

  private async signAccessToken(userId: string, email: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('auth.jwtAccessSecret'),
      expiresIn: this.configService.getOrThrow<number>('auth.jwtAccessTtlSeconds'),
    });
  }

  private async verifyRefreshCookie(refreshCookieValue: string | undefined) {
    const parsed = this.parseRefreshCookie(refreshCookieValue);

    if (!parsed) {
      throw new UnauthorizedException('Authentication required');
    }

    const tokenRow = await this.prisma.refreshToken.findUnique({
      where: { id: parsed.refreshTokenId },
      include: { user: true },
    });

    if (
      !tokenRow ||
      tokenRow.revokedAt ||
      tokenRow.expiresAt <= new Date() ||
      tokenRow.user.status !== UserStatus.active ||
      tokenRow.user.deletedAt
    ) {
      throw new UnauthorizedException('Authentication required');
    }

    const tokenValid = await argon2.verify(tokenRow.tokenHash, parsed.rawToken);

    if (!tokenValid) {
      throw new UnauthorizedException('Authentication required');
    }

    return {
      refreshTokenId: tokenRow.id,
      user: tokenRow.user,
    };
  }

  private parseRefreshCookie(refreshCookieValue: string | undefined) {
    if (!refreshCookieValue) {
      return null;
    }

    const separatorIndex = refreshCookieValue.indexOf('.');

    if (separatorIndex <= 0) {
      return null;
    }

    return {
      refreshTokenId: refreshCookieValue.slice(0, separatorIndex),
      rawToken: refreshCookieValue.slice(separatorIndex + 1),
    };
  }

  private getRefreshExpiryDate(): Date {
    const ttlDays = this.configService.getOrThrow<number>('auth.refreshTokenTtlDays');
    return new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  }

  private toSafeAuthUser(user: {
    id: string;
    email: string;
    status: UserStatus;
    createdAt: Date;
    profile: { handle: string; displayName: string } | null;
  }): SafeAuthUser {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            handle: user.profile.handle,
            displayName: user.profile.displayName,
          }
        : null,
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
