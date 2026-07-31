import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { UpdatePrivacySettingsDto } from './dto/update-privacy-settings.dto';
import { SettingsService } from './settings.service';

@UseGuards(JwtAccessGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('privacy')
  getPrivacySettings(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.settingsService.getPrivacySettings(currentUser);
  }

  @Patch('privacy')
  updatePrivacySettings(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdatePrivacySettingsDto,
  ) {
    return this.settingsService.updatePrivacySettings(currentUser, dto);
  }

  @Get('notifications')
  getNotificationSettings(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.settingsService.getNotificationSettings(currentUser);
  }

  @Patch('notifications')
  updateNotificationSettings(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.settingsService.updateNotificationSettings(currentUser, dto);
  }
}
