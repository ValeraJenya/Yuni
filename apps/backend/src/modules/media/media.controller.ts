import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PROFILE_PHOTO_MAX_BYTES } from './media.constants';
import { MediaService } from './media.service';
import type { UploadedProfilePhotoFile } from './types/uploaded-profile-photo-file';

@UseGuards(JwtAccessGuard)
@Controller('media/profile-photos')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('me')
  getMyProfilePhotos(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.mediaService.getMyProfilePhotos(currentUser);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: PROFILE_PHOTO_MAX_BYTES },
    }),
  )
  uploadProfilePhoto(
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() file: UploadedProfilePhotoFile | undefined,
  ) {
    return this.mediaService.uploadProfilePhoto(currentUser, file);
  }

  @Patch(':photoId/primary')
  setProfilePhotoPrimary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('photoId') photoId: string,
  ) {
    return this.mediaService.setProfilePhotoPrimary(currentUser, photoId);
  }

  @Delete(':photoId')
  deleteProfilePhoto(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('photoId') photoId: string,
  ) {
    return this.mediaService.deleteProfilePhoto(currentUser, photoId);
  }
}
