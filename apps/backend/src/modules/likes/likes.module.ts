import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
