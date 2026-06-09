import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ChatService } from './chat.service';

@UseGuards(JwtAccessGuard)
@Controller('matches')
export class MatchConversationsController {
  constructor(private readonly chatService: ChatService) {}

  @Post(':matchId/conversation')
  startConversation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ) {
    return this.chatService.startConversationFromMatch(currentUser, matchId);
  }
}
