import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MatchesModule } from '../matches/matches.module';
import { ModerationModule } from '../moderation/moderation.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

@Module({
  imports: [JwtModule.register({}), MatchesModule, ModerationModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
