import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CursorPaginationQueryDto } from '../../common/pagination';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateReportDto } from './dto/create-report.dto';
import { ModerationService } from './moderation.service';

@UseGuards(JwtAccessGuard)
@Controller()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('blocks/:targetUserId')
  blockUser(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.moderationService.blockUser(currentUser, targetUserId);
  }

  @Delete('blocks/:targetUserId')
  unblockUser(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.moderationService.unblockUser(currentUser, targetUserId);
  }

  @Get('blocks/me')
  getMyBlocks(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.moderationService.getMyBlocks(currentUser, query);
  }

  @Post('reports')
  reportUser(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ) {
    return this.moderationService.reportUser(currentUser, dto);
  }
}
