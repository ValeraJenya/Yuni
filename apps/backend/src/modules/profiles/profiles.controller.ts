import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { RATE_LIMIT_POLICIES, UseRateLimit } from '../../common/rate-limit';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@UseGuards(JwtAccessGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMe(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.profilesService.getMe(currentUser);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateMe(currentUser, dto);
  }

  @UseRateLimit(RATE_LIMIT_POLICIES.publicProfileLookup)
  @Get(':handle')
  getByHandle(
    @Param('handle') handle: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.profilesService.getByHandle(handle, currentUser);
  }
}
