import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AUTH_SERVICE } from '@app/common/constants';
import { LoginResponse, RegisterResponse } from '@app/common/contracts/auth';
import { LoginDto } from './dto/auth-login.dto';
import { LoginResponseDto } from './dto/auth-login-response.dto';
import { RegisterDto } from './dto/auth-register.dto';
import { RegisterResponseDto } from './dto/auth-register-response.dto';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../common/utils/cookie.util';
import { LocalAuthGuard } from '../common/guards';
import { extractRequestMeta, handleRpcError } from '../common/utils';
import { CurrentUser } from '../common/decorators';
import { AuthenticatedUser } from '../common/types';
import { LogoutResponseDto } from './dto/auth-logout-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject(AUTH_SERVICE) private readonly authServiceClient: ClientProxy,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user and return tokens' })
  @ApiResponse({
    status: 201,
    type: RegisterResponseDto,
    description: 'User registered and authenticated',
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponseDto> {
    const { userAgent, ipAddress } = extractRequestMeta(req);
    const response = await lastValueFrom<RegisterResponse>(
      this.authServiceClient
        .send('register', { ...dto, userAgent, ipAddress })
        .pipe(handleRpcError()),
    );
    setRefreshTokenCookie(res, response.refreshToken);

    return {
      user: response.user,
      accessToken: response.accessToken,
    };
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'User authorization' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    type: LoginResponseDto,
    description: 'User authorized',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { userAgent, ipAddress } = extractRequestMeta(req);
    const { id, username, role } = user;
    const tokens = await lastValueFrom<LoginResponse>(
      this.authServiceClient
        .send('login', { id, username, role, userAgent, ipAddress })
        .pipe(handleRpcError()),
    );
    setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a pair of access and refresh tokens' })
  @ApiResponse({
    status: 201,
    type: LoginResponseDto,
    description: 'Tokens updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid/expired/not found',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { userAgent, ipAddress, refreshToken } = extractRequestMeta(req);

    if (!refreshToken) {
      this.logger.error('Failed to refresh tokens: Refresh token not found');
      throw new HttpException(
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await lastValueFrom<LoginResponse>(
      this.authServiceClient
        .send('refresh', { refreshToken, userAgent, ipAddress })
        .pipe(handleRpcError()),
    );
    setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    type: LogoutResponseDto,
    description: 'User logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid/expired/not found',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const { refreshToken } = extractRequestMeta(req);

    if (!refreshToken) {
      this.logger.error('Failed to logout: Refresh token not found');
      throw new HttpException(
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await lastValueFrom(
      this.authServiceClient
        .send('logout', { refreshToken })
        .pipe(handleRpcError()),
    );
    clearRefreshTokenCookie(res);

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout from all sessions' })
  @ApiResponse({
    status: 200,
    type: LogoutResponseDto,
    description: 'User logged out from all sessions',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid/expired/not found',
  })
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const { refreshToken } = extractRequestMeta(req);

    if (!refreshToken) {
      this.logger.error(
        'Failed to logout all sessions: Refresh token not found',
      );
      throw new HttpException(
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await lastValueFrom(
      this.authServiceClient
        .send('logout_all', { refreshToken })
        .pipe(handleRpcError()),
    );
    clearRefreshTokenCookie(res);

    return { message: 'Logged out from all sessions successfully' };
  }
}
