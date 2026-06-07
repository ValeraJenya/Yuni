import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  MatchStatus,
  Prisma,
  ReportReasonCode,
  UserStatus,
} from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateReportDto } from './dto/create-report.dto';
import { ModerationService } from './moderation.service';

const CURRENT_USER: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'person@example.com',
};
const TARGET_USER_ID = '22222222-2222-4222-8222-222222222222';
const FIXED_NOW = new Date('2026-06-07T12:00:00.000Z');

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
  };
  block: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  match: {
    updateMany: jest.Mock;
  };
  report: {
    create: jest.Mock;
  };
}

interface BlockCreateArgs {
  data: {
    blockedUserId: string;
    createdAt: Date;
  };
}

describe('ModerationService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects self-block before querying the database', async () => {
    const { service, prisma } = createService();

    await expect(
      service.blockUser(CURRENT_USER, CURRENT_USER.id),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.block.create).not.toHaveBeenCalled();
  });

  it('creates a block and ends active matches between the users', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique
      .mockResolvedValueOnce(activeUser())
      .mockResolvedValueOnce(activeUser());
    prisma.block.findUnique.mockResolvedValue(null);
    prisma.block.create.mockImplementation(async (args: BlockCreateArgs) => ({
      blockedUserId: args.data.blockedUserId,
      createdAt: args.data.createdAt,
    }));

    const result = await service.blockUser(CURRENT_USER, TARGET_USER_ID);

    expect(prisma.block.create).toHaveBeenCalledWith({
      data: {
        blockerUserId: CURRENT_USER.id,
        blockedUserId: TARGET_USER_ID,
        createdAt: FIXED_NOW,
      },
      select: {
        blockedUserId: true,
        createdAt: true,
      },
    });
    expect(prisma.match.updateMany).toHaveBeenCalledWith({
      where: {
        status: MatchStatus.active,
        expiresAt: {
          gt: FIXED_NOW,
        },
        OR: [
          {
            userAId: CURRENT_USER.id,
            userBId: TARGET_USER_ID,
          },
          {
            userAId: TARGET_USER_ID,
            userBId: CURRENT_USER.id,
          },
        ],
      },
      data: {
        status: MatchStatus.blocked,
        endedAt: FIXED_NOW,
      },
    });
    expect(result).toEqual({
      block: {
        blockedUserId: TARGET_USER_ID,
        createdAt: FIXED_NOW,
        status: 'blocked',
      },
    });
    expectNoPrivateModerationKeys(result);
  });

  it('returns idempotent success for duplicate blocks without creating a row', async () => {
    const { service, prisma } = createService();
    const existingBlock = {
      blockedUserId: TARGET_USER_ID,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
    };
    prisma.user.findUnique
      .mockResolvedValueOnce(activeUser())
      .mockResolvedValueOnce(activeUser());
    prisma.block.findUnique.mockResolvedValue(existingBlock);

    await expect(
      service.blockUser(CURRENT_USER, TARGET_USER_ID),
    ).resolves.toEqual({
      block: {
        ...existingBlock,
        status: 'blocked',
      },
    });

    expect(prisma.block.create).not.toHaveBeenCalled();
    expect(prisma.match.updateMany).toHaveBeenCalledTimes(1);
  });

  it('maps duplicate block constraint races to idempotent success', async () => {
    const { service, prisma } = createService();
    const existingBlock = {
      blockedUserId: TARGET_USER_ID,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
    };
    prisma.user.findUnique
      .mockResolvedValueOnce(activeUser())
      .mockResolvedValueOnce(activeUser());
    prisma.block.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingBlock);
    prisma.block.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.blockUser(CURRENT_USER, TARGET_USER_ID),
    ).resolves.toEqual({
      block: {
        ...existingBlock,
        status: 'blocked',
      },
    });
    expect(prisma.match.updateMany).toHaveBeenCalledTimes(1);
  });

  it('unblocks only the current user pair and stays idempotent', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.block.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service.unblockUser(CURRENT_USER, TARGET_USER_ID),
    ).resolves.toEqual({
      success: true,
      blockedUserId: TARGET_USER_ID,
    });

    expect(prisma.block.deleteMany).toHaveBeenCalledWith({
      where: {
        blockerUserId: CURRENT_USER.id,
        blockedUserId: TARGET_USER_ID,
      },
    });
    expect(prisma.match.updateMany).not.toHaveBeenCalled();
  });

  it('lists only the current user blocks with safe paginated shape', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(activeUser());
    prisma.block.findMany.mockResolvedValue([
      {
        id: 'block-2',
        blockedUserId: '33333333-3333-4333-8333-333333333333',
        createdAt: new Date('2026-06-02T00:00:00.000Z'),
      },
      {
        id: 'block-1',
        blockedUserId: TARGET_USER_ID,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.getMyBlocks(CURRENT_USER, { limit: 1 });

    expect(prisma.block.findMany).toHaveBeenCalledWith({
      where: {
        blockerUserId: CURRENT_USER.id,
      },
      select: {
        id: true,
        blockedUserId: true,
        createdAt: true,
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      take: 2,
    });
    expect(result).toEqual({
      blocks: [
        {
          blockedUserId: '33333333-3333-4333-8333-333333333333',
          createdAt: new Date('2026-06-02T00:00:00.000Z'),
          status: 'blocked',
        },
      ],
      nextCursor: 'block-2',
    });
    expectNoPrivateModerationKeys(result);
  });

  it('rejects inactive current users and missing targets safely', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValueOnce({
      status: UserStatus.disabled,
      deletedAt: null,
    });

    await expect(
      service.blockUser(CURRENT_USER, TARGET_USER_ID),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    prisma.user.findUnique
      .mockResolvedValueOnce(activeUser())
      .mockResolvedValueOnce(null);

    await expect(
      service.reportUser(CURRENT_USER, {
        targetUserId: TARGET_USER_ID,
        reason: ReportReasonCode.spam,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects self-report before writing', async () => {
    const { service, prisma } = createService();

    await expect(
      service.reportUser(CURRENT_USER, {
        targetUserId: CURRENT_USER.id,
        reason: ReportReasonCode.harassment,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it('creates reports with safe public status only', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique
      .mockResolvedValueOnce(activeUser())
      .mockResolvedValueOnce(activeUser());
    prisma.report.create.mockResolvedValue({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      reportedUserId: TARGET_USER_ID,
      reasonCode: ReportReasonCode.fake_profile,
      createdAt: FIXED_NOW,
    });

    const result = await service.reportUser(CURRENT_USER, {
      targetUserId: TARGET_USER_ID,
      reason: ReportReasonCode.fake_profile,
      details: null,
    });

    expect(prisma.report.create).toHaveBeenCalledWith({
      data: {
        reporterUserId: CURRENT_USER.id,
        reportedUserId: TARGET_USER_ID,
        reasonCode: ReportReasonCode.fake_profile,
        comment: null,
      },
      select: {
        id: true,
        reportedUserId: true,
        reasonCode: true,
        createdAt: true,
      },
    });
    expect(result).toEqual({
      report: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        targetUserId: TARGET_USER_ID,
        reason: ReportReasonCode.fake_profile,
        createdAt: FIXED_NOW,
        status: 'received',
      },
    });
    expectNoPrivateModerationKeys(result);
  });

  it('validates report reason and details length at DTO level', async () => {
    const invalid = plainToInstance(CreateReportDto, {
      targetUserId: TARGET_USER_ID,
      reason: 'not_a_reason',
      details: 'x'.repeat(1001),
    });
    const emptyDetails = plainToInstance(CreateReportDto, {
      targetUserId: TARGET_USER_ID,
      reason: ReportReasonCode.other,
      details: '   ',
    });

    await expect(validate(invalid)).resolves.toHaveLength(2);
    expect(emptyDetails.details).toBeNull();
    await expect(validate(emptyDetails)).resolves.toHaveLength(0);
  });

  it('detects blocks in either direction for interaction checks', async () => {
    const { service, prisma } = createService();
    prisma.block.findFirst.mockResolvedValue({ id: 'block-id' });

    await expect(
      service.hasBlockBetween(CURRENT_USER.id, TARGET_USER_ID),
    ).resolves.toBe(true);
    expect(prisma.block.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            blockerUserId: CURRENT_USER.id,
            blockedUserId: TARGET_USER_ID,
          },
          {
            blockerUserId: TARGET_USER_ID,
            blockedUserId: CURRENT_USER.id,
          },
        ],
      },
      select: {
        id: true,
      },
    });
  });
});

function createService() {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    block: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    match: {
      updateMany: jest.fn(),
    },
    report: {
      create: jest.fn(),
    },
  };

  return {
    service: new ModerationService(prisma as unknown as PrismaService),
    prisma,
  };
}

function activeUser() {
  return {
    status: UserStatus.active,
    deletedAt: null,
  };
}

function expectNoPrivateModerationKeys(value: unknown): void {
  const keys = collectObjectKeys(value);
  const forbiddenKeys = [
    'blockerUserId',
    'reporterUserId',
    'reportedUserId',
    'reasonCode',
    'comment',
    'updatedAt',
    'resolvedAt',
    'resolutionNote',
    'email',
    'birthDate',
    'passwordHash',
    'refreshToken',
    'tokenHash',
    'storageKey',
  ];

  for (const key of forbiddenKeys) {
    expect(keys).not.toContain(key);
  }
}

function collectObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object' || value instanceof Date) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectObjectKeys(item));
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => [
    key,
    ...collectObjectKeys(nestedValue),
  ]);
}
