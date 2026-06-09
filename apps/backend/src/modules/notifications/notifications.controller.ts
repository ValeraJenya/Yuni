import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CursorPaginationQueryDto } from '../../common/pagination';
import { RATE_LIMIT_POLICIES, UseRateLimit } from '../../common/rate-limit';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAccessGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseRateLimit(RATE_LIMIT_POLICIES.notificationsList)
  @Get()
  listNotifications(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.notificationsService.listMyNotifications(currentUser, query);
  }

  @UseRateLimit(RATE_LIMIT_POLICIES.notificationsUnreadCount)
  @Get('unread-count')
  getUnreadCount(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(currentUser);
  }

  @UseRateLimit(RATE_LIMIT_POLICIES.notificationsMarkRead)
  @Post('read-all')
  markAllRead(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.notificationsService.markAllRead(currentUser);
  }

  @UseRateLimit(RATE_LIMIT_POLICIES.notificationsMarkRead)
  @Post(':notificationId/read')
  markOneRead(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    return this.notificationsService.markOneRead(currentUser, notificationId);
  }
}
