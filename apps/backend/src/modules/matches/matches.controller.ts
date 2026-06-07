import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { MatchesService } from './matches.service';

@UseGuards(JwtAccessGuard)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('me')
  getMyMatches(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.matchesService.getMyMatches(currentUser);
  }
}
