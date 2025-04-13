import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { USER_SERVICE } from '@app/common/constants';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import {
  LoginResponse,
  LoginPayload,
  ValidateUserPayload,
  ValidateUserResponse,
  LogoutPayload,
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
      this.userServiceClient.send<User | null>('get_user_by_name', {
        username,
      }),
    );

    if (!user) {
      this.logger.error(`Failed to validate user: Invalid credentials`);
      throw new RpcException({
        message: 'Invalid credentials',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

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
    const tokens = await this.tokenService.getTokens(
      String(loginPayload.userId),
      loginPayload.username,
    );

    await this.tokenService.updateRefreshToken(
      String(loginPayload.userId),
      tokens.refreshToken,
    );

    return tokens;
  }

  async refresh(payload: LogoutPayload): Promise<LoginResponse> {
    const { refreshToken } = payload;
    const verifiedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    if (!verifiedRefreshToken) {
      throw new RpcException({
        message: 'Invalid refresh token',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const tokenRecord = await this.tokenService.findToken(refreshToken);

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new RpcException({
        message: 'Refresh token is invalid or expired',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const tokens = await this.tokenService.getTokens(
      String(tokenRecord.user.id),
      tokenRecord.user.username,
    );

    await this.tokenService.removeRefreshTokenById(tokenRecord.id);
    await this.tokenService.updateRefreshToken(
      String(tokenRecord.user.id),
      tokens.refreshToken,
    );

    return tokens;
  }

  async logout(logoutPayload: LogoutPayload) {
    const verifiedRefreshToken = await this.tokenService.verifyRefreshToken(
      logoutPayload.refreshToken,
    );

    if (!verifiedRefreshToken) {
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
      throw new RpcException({
        message: 'Invalid refresh token',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    await this.tokenService.removeAllRefreshTokens(logoutPayload.refreshToken);
  }
}
