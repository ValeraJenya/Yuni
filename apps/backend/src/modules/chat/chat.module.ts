import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MatchConversationsController } from './match-conversations.controller';

@Module({
  imports: [JwtModule.register({}), ModerationModule, NotificationsModule],
  controllers: [ChatController, MatchConversationsController],
  providers: [ChatService],
})
export class ChatModule {}
