import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ReportReasonCode } from '@prisma/client';

function trimNullableString(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class CreateReportDto {
  @IsUUID()
  targetUserId!: string;

  @IsEnum(ReportReasonCode)
  reason!: ReportReasonCode;

  @Transform(({ value }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string | null;
}
