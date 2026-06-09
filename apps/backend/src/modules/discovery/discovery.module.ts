import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
