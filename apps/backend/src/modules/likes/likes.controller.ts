import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { LikesService } from './likes.service';

@UseGuards(JwtAccessGuard)
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':targetProfileUserId')
  likeProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('targetProfileUserId', ParseUUIDPipe) targetProfileUserId: string,
  ) {
    return this.likesService.likeProfile(currentUser, targetProfileUserId);
  }

  @Post(':targetProfileUserId/skip')
  skipProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('targetProfileUserId', ParseUUIDPipe) targetProfileUserId: string,
  ) {
    return this.likesService.skipProfile(currentUser, targetProfileUserId);
  }
}
