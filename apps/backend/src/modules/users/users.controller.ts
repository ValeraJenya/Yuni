import { Controller, Get, UseGuards } from '@nestjs/common';
import { RATE_LIMIT_POLICIES, UseRateLimit } from '../../common/rate-limit';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UsersService } from './users.service';

@UseGuards(JwtAccessGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Task 067a. Выгрузка собственных персональных данных.
   *
   * Идентичность берётся только из JwtAccessGuard через @CurrentUser: никакого
   * user id из path, query или body — иначе эндпоинт стал бы способом выгрузить
   * чужой аккаунт.
   *
   * Отдаётся обычным JSON-ответом, без Content-Disposition: attachment —
   * скачивание файлом имеет смысл вместе с кнопкой в интерфейсе, которой пока
   * нет.
   */
  @UseRateLimit(RATE_LIMIT_POLICIES.usersDataExport)
  @Get('me/export')
  exportMyData(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.exportMyData(currentUser);
  }
}
