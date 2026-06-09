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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ChatService } from './chat.service';
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

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(currentUser, conversationId, dto);
  }
}
