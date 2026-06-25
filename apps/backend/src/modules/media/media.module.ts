import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalProfilePhotoStorageService } from './storage/local-profile-photo-storage.service';
import { PROFILE_PHOTO_STORAGE } from './storage/profile-photo-storage.port';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: PROFILE_PHOTO_STORAGE,
      useClass: LocalProfilePhotoStorageService,
    },
  ],
})
export class MediaModule {}
