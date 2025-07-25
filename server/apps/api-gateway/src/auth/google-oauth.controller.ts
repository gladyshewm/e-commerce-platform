import { Controller, Get, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { GoogleAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { AuthenticatedUser } from '../common/types';
import {
  extractRequestMeta,
  handleRpcError,
  setRefreshTokenCookie,
} from '../common/utils';
import { LoginResponse } from '@app/common/contracts/auth';
import { AUTH_SERVICE } from '@app/common/constants';
import { AuthCommands } from '@app/common/messaging';
import { LoginResponseDto } from './dto/auth-login-response.dto';

@Controller('auth/google')
export class GoogleOauthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authServiceClient: ClientProxy,
  ) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {}

  @Get('callback')
  @UseGuards(GoogleAuthGuard)
  async googleLoginCallback(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { userAgent, ipAddress } = extractRequestMeta(req);
    const { id, username, role } = user;

    const tokens = await lastValueFrom<LoginResponse>(
      this.authServiceClient
        .send(AuthCommands.Login, { id, username, role, userAgent, ipAddress })
        .pipe(handleRpcError()),
    );
    setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }
}
