import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { RATE_LIMIT_POLICIES, UseRateLimit } from '../../common/rate-limit';
import { REFRESH_TOKEN_COOKIE_PATH } from './auth.constants';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import type { AuthenticatedUser } from './types/authenticated-user';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @UseRateLimit(RATE_LIMIT_POLICIES.authRegister)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto, this.getClientMeta(request));
    this.setRefreshCookie(response, result.refreshCookieValue, result.refreshExpiresAt);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @UseRateLimit(RATE_LIMIT_POLICIES.authLogin)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto, this.getClientMeta(request));
    this.setRefreshCookie(response, result.refreshCookieValue, result.refreshExpiresAt);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @UseRateLimit(RATE_LIMIT_POLICIES.authRefresh)
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshCookie = request.cookies?.[
      this.configService.getOrThrow<string>('auth.refreshCookieName')
    ];
    const result = await this.authService.refresh(refreshCookie, this.getClientMeta(request));
    this.setRefreshCookie(response, result.refreshCookieValue, result.refreshExpiresAt);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @UseRateLimit(RATE_LIMIT_POLICIES.authLogout)
  @HttpCode(200)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshCookie = request.cookies?.[
      this.configService.getOrThrow<string>('auth.refreshCookieName')
    ];
    const result = await this.authService.logout(refreshCookie);
    this.clearRefreshCookie(response);
    return result;
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  async getMe(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.getMe(currentUser);
  }

  private getClientMeta(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    };
  }

  private setRefreshCookie(
    response: Response,
    refreshCookieValue: string,
    expiresAt: Date,
  ): void {
    response.cookie(
      this.configService.getOrThrow<string>('auth.refreshCookieName'),
      refreshCookieValue,
      {
        ...this.getRefreshCookieOptions(),
        expires: expiresAt,
      },
    );
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(
      this.configService.getOrThrow<string>('auth.refreshCookieName'),
      this.getRefreshCookieOptions(),
    );
  }

  private getRefreshCookieOptions(): CookieOptions {
    const environment = this.configService.getOrThrow<string>('app.environment');

    return {
      httpOnly: true,
      secure: environment === 'production',
      sameSite: environment === 'production' ? 'none' : 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
    };
  }
}
