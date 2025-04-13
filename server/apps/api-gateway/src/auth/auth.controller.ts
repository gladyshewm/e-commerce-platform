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
import { CurrentUser } from '@app/common/decorators';
import { catchError, lastValueFrom } from 'rxjs';
import { AUTH_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/auth-login.dto';
import { LoginResponseDto } from './dto/auth-login-response.dto';
import { RegisterDto } from './dto/auth-register.dto';
import { User } from '@app/common/contracts/user';
import { LoginResponse, RegisterResponse } from '@app/common/contracts/auth';
import { RegisterResponseDto } from './dto/auth-register-response.dto';
import { Request, Response } from 'express';

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
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponseDto> {
    const response = await lastValueFrom<RegisterResponse>(
      this.authServiceClient.send('register', dto).pipe(
        catchError((error) => {
          throw new HttpException(error.message, error.statusCode);
        }),
      ),
    );

    res.cookie('refreshToken', response.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const tokens = await lastValueFrom<LoginResponse>(
      this.authServiceClient.send('login', user).pipe(
        catchError((error) => {
          throw new HttpException(error.message, error.statusCode);
        }),
      ),
    );

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      this.logger.error('Failed to refresh tokens: Refresh token not found');
      throw new HttpException(
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await lastValueFrom<LoginResponse>(
      this.authServiceClient.send('refresh', { refreshToken }).pipe(
        catchError((error) => {
          throw new HttpException(error.message, error.statusCode);
        }),
      ),
    );

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      this.logger.error('Failed to logout: Refresh token not found');
      throw new HttpException(
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await lastValueFrom(
      this.authServiceClient.send('logout', { refreshToken }).pipe(
        catchError((error) => {
          throw new HttpException(error.message, error.statusCode);
        }),
      ),
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
    const refreshToken = req.cookies['refreshToken'];

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
      this.authServiceClient.send('logout_all', { refreshToken }).pipe(
        catchError((error) => {
          throw new HttpException(error.message, error.statusCode);
        }),
      ),
    );

    res.clearCookie('refreshToken');

    return { message: 'Logged out from all sessions successfully' };
  }
}
