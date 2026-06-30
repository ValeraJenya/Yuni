import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CursorPaginationQueryDto } from '../../common/pagination';
import { RATE_LIMIT_POLICIES, UseRateLimit } from '../../common/rate-limit';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ChatService } from './chat.service';
import { AnswerGameDto } from './dto/answer-game.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@UseGuards(JwtAccessGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.chatService.getConversations(currentUser, query);
  }

  @Get('conversations/:conversationId/messages')
  getMessages(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.chatService.getMessages(currentUser, conversationId, query);
  }

  @Get('conversations/:conversationId/stage')
  getConversationStage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.chatService.getConversationStage(currentUser, conversationId);
  }

  @Get('starters')
  getStarters() {
    return this.chatService.getStarters();
  }

  @Get('conversations/:conversationId/game/current')
  getCurrentGame(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.chatService.getCurrentGame(currentUser, conversationId);
  }

  @Post('conversations/:conversationId/game/postpone')
  postponeCurrentGame(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.chatService.postponeCurrentGame(currentUser, conversationId);
  }

  @Post('conversations/:conversationId/game/:gameId/answer')
  answerGame(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @Body() dto: AnswerGameDto,
  ) {
    return this.chatService.answerGame(
      currentUser,
      conversationId,
      gameId,
      dto.answer,
    );
  }

  @UseRateLimit(RATE_LIMIT_POLICIES.chatSend)
  @Post('conversations/:conversationId/messages')
  sendMessage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(currentUser, conversationId, dto);
  }
}
