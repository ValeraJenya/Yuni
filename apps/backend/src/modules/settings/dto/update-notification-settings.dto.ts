import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  likesEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  matchesEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  messagesEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  productUpdatesEnabled?: boolean;
}
