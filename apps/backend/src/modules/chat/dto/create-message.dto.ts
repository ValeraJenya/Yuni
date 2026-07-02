import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const MESSAGE_TEXT_MAX_LENGTH = 2000;
export const MESSAGE_TYPES = ['text', 'voice', 'attachment'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function toInteger(value: unknown): unknown {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return value;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : value;
}

export class CreateMessageDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(MESSAGE_TEXT_MAX_LENGTH)
  text!: string;

  @IsOptional()
  @IsIn(MESSAGE_TYPES)
  messageType?: MessageType;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(1)
  @Max(24 * 60 * 60)
  voiceDurationSec?: number;
}
