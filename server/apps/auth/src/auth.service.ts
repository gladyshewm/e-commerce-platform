import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { USER_SERVICE } from '@app/common/constants';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom, of } from 'rxjs';
import * as bcrypt from 'bcrypt';
import {
  LoginResponse,
  LoginPayload,
  ValidateUserPayload,
  ValidateUserResponse,
  LogoutPayload,
  RefreshPayload,
  ValidateUserOAuthPayload,
  RegisterPayload,
  RegisterResponse,
} from '@app/common/contracts/auth';
import {
  User,
  UserWithOAuth,
  UserWithoutPassword,
} from '@app/common/contracts/user';
import { UserCommands } from '@app/common/messaging';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
  ) {}

  async validateUser(
    payload: ValidateUserPayload,
  ): Promise<ValidateUserResponse> {
    const { username, password } = payload;
    const user = await lastValueFrom(
      this.userServiceClient
        .send<User>(UserCommands.GetByName, {
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

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { ipAddress, userAgent, ...credentials } = payload;
    const user = await lastValueFrom(
      this.userServiceClient
        .send<UserWithoutPassword>(UserCommands.Create, credentials)
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              statusCode: error.statusCode,
            });
          }),
        ),
    );

    const tokens = await this.login({
      ...user,
      ipAddress,
      userAgent,
    });

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(loginPayload: LoginPayload): Promise<LoginResponse> {
    const { id, username, role, ipAddress, userAgent } = loginPayload;

    const tokens = await this.tokenService.getTokens({
      userId: id,
      username,
      userRole: role,
    });
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

    const tokens = await this.tokenService.getTokens({
      userId: tokenRecord.user.id,
      username: tokenRecord.user.username,
      userRole: tokenRecord.user.role,
    });

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

  async validateUserOAuth(
    payload: ValidateUserOAuthPayload,
  ): Promise<ValidateUserResponse> {
    const { provider, providerId, username, email } = payload;

    const existingOAuthUser = await lastValueFrom<UserWithOAuth | null>(
      this.userServiceClient
        .send(UserCommands.GetByOAuth, { provider, providerId })
        .pipe(catchError(() => of(null))),
    );

    if (existingOAuthUser) {
      const { oauthAccounts, ...user } = existingOAuthUser;
      return user;
    }

    const existingUser = await lastValueFrom<User | null>(
      this.userServiceClient
        .send(UserCommands.GetByEmail, { email })
        .pipe(catchError(() => of(null))),
    );

    let user: UserWithoutPassword;

    if (existingUser) {
      user = await lastValueFrom<UserWithoutPassword>(
        this.userServiceClient
          .send(UserCommands.LinkWithOAuth, {
            userId: existingUser.id,
            provider,
            providerId,
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
    } else {
      user = await lastValueFrom<UserWithoutPassword>(
        this.userServiceClient
          .send(UserCommands.CreateOAuth, {
            username,
            email,
            provider,
            providerId,
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
    }

    return user;
  }
}
