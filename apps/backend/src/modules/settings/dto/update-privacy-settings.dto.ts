import { ProfileVisibilityMode } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsEnum(ProfileVisibilityMode)
  profileVisibilityMode?: ProfileVisibilityMode;

  @IsOptional()
  @IsBoolean()
  showDistance?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  showDisplayNameInPrivateMode?: boolean;

  @IsOptional()
  @IsBoolean()
  showBioInPrivateMode?: boolean;

  @IsOptional()
  @IsBoolean()
  showLocationInPrivateMode?: boolean;

  @IsOptional()
  @IsBoolean()
  discoverable?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMessagesFromMatchesOnly?: boolean;
}
