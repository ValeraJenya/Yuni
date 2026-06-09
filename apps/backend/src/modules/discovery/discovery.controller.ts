import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RATE_LIMIT_POLICIES, UseRateLimit } from '../../common/rate-limit';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DiscoveryCardsQueryDto } from './dto/discovery-cards-query.dto';
import { DiscoveryService } from './discovery.service';

@UseGuards(JwtAccessGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @UseRateLimit(RATE_LIMIT_POLICIES.discoveryCards)
  @Get('cards')
  getCards(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DiscoveryCardsQueryDto,
  ) {
    return this.discoveryService.getCards(currentUser, query);
  }
}
