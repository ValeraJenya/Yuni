import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
