import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MatchesModule } from '../matches/matches.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

@Module({
  imports: [JwtModule.register({}), MatchesModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
