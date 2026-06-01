import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimRequiredString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimNullableString(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class UpdateProfileDto {
  @Transform(({ value }) => trimRequiredString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @Transform(({ value }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @Transform(({ value }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  gender?: string | null;

  @Transform(({ value }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  lookingFor?: string | null;

  @Transform(({ value }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @Transform(({ value }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string | null;

  @IsOptional()
  @IsBoolean()
  isDiscoverable?: boolean;
}
