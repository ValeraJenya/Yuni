import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const GAME_ANSWER_MAX_LENGTH = 2000;

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class AnswerGameDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(GAME_ANSWER_MAX_LENGTH)
  answer!: string;
}
