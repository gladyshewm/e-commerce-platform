import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { USER_SERVICE } from '@app/common/constants';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import {
  LoginResponse,
  LoginPayload,
  ValidateUserPayload,
  ValidateUserResponse,
  LogoutPayload,
  RefreshPayload,
} from '@app/common/contracts/auth';
import { User } from '@app/common/contracts/user';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
    private readonly tokenService: TokenService,
  ) {}

  async validateUser(
    payload: ValidateUserPayload,
  ): Promise<ValidateUserResponse> {
    const { username, password } = payload;
    const user = await lastValueFrom(
      this.userServiceClient
        .send<User>('get_user_by_name', {
          username,
        })
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              statusCode: error.statusCode,
            });
          }),
        ),
    );

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      this.logger.error(`Failed to validate user: Invalid credentials`);
      throw new RpcException({
        message: 'Invalid credentials',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginPayload: LoginPayload): Promise<LoginResponse> {
    const { id, username, ipAddress, userAgent } = loginPayload;

    const tokens = await this.tokenService.getTokens(id, username);
    await this.tokenService.updateRefreshToken({
      userId: id,
      refreshToken: tokens.refreshToken,
      ipAddress,
      userAgent,
    });

    return tokens;
  }

  async refresh(payload: RefreshPayload): Promise<LoginResponse> {
    const { refreshToken, ipAddress, userAgent } = payload;
    const verifiedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    if (!verifiedRefreshToken) {
      this.logger.error(`Failed to refresh tokens: Invalid refresh token`);
      throw new RpcException({
        message: 'Invalid refresh token',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const tokenRecord = await this.tokenService.findToken(refreshToken);

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      this.logger.error(
        `Failed to refresh tokens: Refresh token ${!tokenRecord ? 'not found' : 'expired'}`,
      );
      throw new RpcException({
        message: `Refresh token ${!tokenRecord ? 'not found' : 'expired'}`,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const tokens = await this.tokenService.getTokens(
      tokenRecord.user.id,
      tokenRecord.user.username,
    );

    await this.tokenService.removeRefreshTokenById(tokenRecord.id);
    await this.tokenService.updateRefreshToken({
      userId: tokenRecord.user.id,
      refreshToken: tokens.refreshToken,
      ipAddress,
      userAgent,
    });

    return tokens;
  }

  async logout(logoutPayload: LogoutPayload) {
    const verifiedRefreshToken = await this.tokenService.verifyRefreshToken(
      logoutPayload.refreshToken,
    );

    if (!verifiedRefreshToken) {
      this.logger.error(`Failed to logout: Invalid refresh token`);
      throw new RpcException({
        message: 'Invalid refresh token',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    await this.tokenService.removeRefreshToken(logoutPayload.refreshToken);
  }

  async logoutAll(logoutPayload: LogoutPayload) {
    const verifiedRefreshToken = await this.tokenService.verifyRefreshToken(
      logoutPayload.refreshToken,
    );

    if (!verifiedRefreshToken) {
      this.logger.error(`Failed to logout all sessions: Invalid refresh token`);
      throw new RpcException({
        message: 'Invalid refresh token',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    await this.tokenService.removeAllRefreshTokens(logoutPayload.refreshToken);
  }
}
