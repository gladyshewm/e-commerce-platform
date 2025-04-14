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
import { LocalAuthGuard } from '@app/common/auth';
import { lastValueFrom } from 'rxjs';
import { AUTH_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/auth-login.dto';
import { LoginResponseDto } from './dto/auth-login-response.dto';
import { RegisterDto } from './dto/auth-register.dto';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { LoginResponse, RegisterResponse } from '@app/common/contracts/auth';
import { RegisterResponseDto } from './dto/auth-register-response.dto';
import { Request, Response } from 'express';
import { extractRequestMeta } from '../utils/request.util';
import { setRefreshTokenCookie } from '../utils/cookie.util';
import { handleRpcError } from '../utils/rpc-exception.utils';
import { CurrentUser } from '../decorators/user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject(AUTH_SERVICE) private readonly authServiceClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'Register new user and return tokens' })
  @ApiResponse({
    status: 201,
    type: RegisterResponseDto,
    description: 'User registered and authenticated',
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post('register')
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

  @ApiOperation({ summary: 'User authorization' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    type: LoginResponseDto,
    description: 'User authorized',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: UserWithoutPassword,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { userAgent, ipAddress } = extractRequestMeta(req);
    const tokens = await lastValueFrom<LoginResponse>(
      this.authServiceClient
        .send('login', { ...user, userAgent, ipAddress })
        .pipe(handleRpcError()),
    );
    setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

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
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
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

  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    example: { message: 'Logged out successfully' },
    description: 'User logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid/expired/not found',
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
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
    res.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'User logout from all sessions' })
  @ApiResponse({
    status: 200,
    example: { message: 'Logged out from all sessions successfully' },
    description: 'User logged out from all sessions',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid/expired/not found',
  })
  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
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
    res.clearCookie('refreshToken');

    return { message: 'Logged out from all sessions successfully' };
  }
}
