import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { USER_SERVICE } from '@app/common/constants';
import { of, throwError } from 'rxjs';
import { TokenService } from './token.service';
import {
  JwtPayload,
  LoginPayload,
  LoginResponse,
  LogoutPayload,
  RefreshPayload,
  RegisterPayload,
  RegisterResponse,
  ValidateUserOAuthPayload,
  ValidateUserPayload,
  ValidateUserResponse,
} from '@app/common/contracts/auth';
import {
  User,
  UserWithOAuth,
  UserWithoutPassword,
} from '@app/common/contracts/user';
import { TokenEntity, UserEntity } from '@app/common/database/entities';
import { UserRole } from '@app/common/database/enums';
import { UserCommands } from '@app/common/messaging';

jest.mock('./token.service');
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let userServiceClient: jest.Mocked<ClientProxy>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenService,
        {
          provide: USER_SERVICE,
          useValue: {
            send: jest.fn().mockReturnValue(of({})),
            pipe: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
    }).compile();

    authService = app.get<AuthService>(AuthService);
    userServiceClient = app.get<jest.Mocked<ClientProxy>>(USER_SERVICE);
    tokenService = app.get<jest.Mocked<TokenService>>(TokenService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
    });
  });

  describe('validateUser', () => {
    let result: ValidateUserResponse;
    const payload: ValidateUserPayload = {
      username: 'test',
      password: 'test',
    };
    const user = {
      id: 1,
      username: 'test',
      password: 'test',
    } as User;

    beforeEach(async () => {
      userServiceClient.send.mockReturnValue(of(user));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      result = await authService.validateUser(payload);
    });

    it('should call userServiceClient', () => {
      expect(userServiceClient.send).toHaveBeenCalledWith(
        UserCommands.GetByName,
        {
          username: payload.username,
        },
      );
    });

    it('should compare payload.password with hashed password from DB', () => {
      expect(bcrypt.compare).toHaveBeenCalledWith(
        payload.password,
        user.password,
      );
    });

    it('should throw RpcException when password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.validateUser(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should return user without password', () => {
      const { password, ...rest } = user;
      expect(result).toEqual(rest);
    });
  });

  describe('register', () => {
    let result: RegisterResponse;
    const payload: RegisterPayload = {
      username: 'test',
      email: 'test',
      password: 'test',
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    };
    const tokens: LoginResponse = {
      accessToken: 'access',
      refreshToken: 'refresh',
    };
    const user = {
      id: 1,
      username: 'test',
      email: 'test',
    } as UserWithoutPassword;
    let loginSpy: jest.SpyInstance;

    beforeEach(async () => {
      loginSpy = jest.spyOn(authService, 'login').mockResolvedValue(tokens);
      userServiceClient.send.mockReturnValue(of(user));
    });

    it('should create user', async () => {
      const { ipAddress, userAgent, ...credentials } = payload;
      await authService.register(payload);

      expect(userServiceClient.send).toHaveBeenCalledWith(
        UserCommands.Create,
        credentials,
      );
    });

    it('should throw RpcException if userServiceClient throws', async () => {
      userServiceClient.send.mockReturnValue(
        throwError(() => new RpcException('Failed')),
      );

      await expect(authService.register(payload)).rejects.toThrow(RpcException);
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should login created user', async () => {
      await authService.register(payload);
      const { ipAddress, userAgent } = payload;

      expect(loginSpy).toHaveBeenCalledWith({
        ...user,
        ipAddress,
        userAgent,
      });
    });

    it('should return created user and tokens', async () => {
      result = await authService.register(payload);
      expect(result).toEqual({ user, ...tokens });
    });
  });

  describe('login', () => {
    let result: LoginResponse;
    const payload: LoginPayload = {
      id: 1,
      username: 'test_name',
      role: UserRole.CUSTOMER,
      ipAddress: '127.0.0.0',
      userAgent: 'test',
    };
    const tokens: LoginResponse = {
      accessToken: 'access',
      refreshToken: 'refresh',
    };

    beforeEach(async () => {
      tokenService.getTokens.mockResolvedValue(tokens);
      result = await authService.login(payload);
    });

    it('should get tokens from tokenService', () => {
      expect(tokenService.getTokens).toHaveBeenCalledWith({
        userId: payload.id,
        username: payload.username,
        userRole: payload.role,
      });
    });

    it('should update refreshToken', () => {
      expect(tokenService.updateRefreshToken).toHaveBeenCalledWith({
        userId: payload.id,
        refreshToken: tokens.refreshToken,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
      });
    });

    it('should return tokens', () => {
      expect(result).toEqual(tokens);
    });
  });

  describe('refresh', () => {
    let result: LoginResponse;
    const payload: RefreshPayload = {
      refreshToken: 'refresh',
      ipAddress: '127.0.0.0',
      userAgent: 'test',
    };
    const tokens: LoginResponse = {
      accessToken: 'access',
      refreshToken: 'refresh',
    };
    const tokenRecord: TokenEntity = {
      id: 1,
      refreshToken: 'refresh',
      expiresAt: new Date('2099-01-01'),
      createdAt: new Date(),
      user: { id: 1 } as UserEntity,
    };

    beforeEach(async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({} as JwtPayload);
      tokenService.findToken.mockResolvedValue(tokenRecord);
      tokenService.getTokens.mockResolvedValue(tokens);
      result = await authService.refresh(payload);
    });

    it('should call tokenService to verify refresh token', () => {
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        payload.refreshToken,
      );
    });

    it('should throw RpcException when token verification failed', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(null);
      await expect(authService.refresh(payload)).rejects.toThrow(RpcException);
    });

    it('should call tokenService to find refresh token in the DB', () => {
      expect(tokenService.findToken).toHaveBeenCalledWith(payload.refreshToken);
    });

    it('should throw RpcException when token not found', async () => {
      tokenService.findToken.mockResolvedValue(null);
      await expect(authService.refresh(payload)).rejects.toThrow(RpcException);
    });

    it('should throw RpcException when token is expired', async () => {
      tokenService.findToken.mockResolvedValueOnce({
        ...tokenRecord,
        expiresAt: new Date('1970-01-01'),
      });
      await expect(authService.refresh(payload)).rejects.toThrow(RpcException);
    });

    it('should get tokens from tokenService', () => {
      expect(tokenService.getTokens).toHaveBeenCalledWith({
        userId: tokenRecord.user.id,
        username: tokenRecord.user.username,
        userRole: tokenRecord.user.role,
      });
    });

    it('should remove refresh token from DB', () => {
      expect(tokenService.removeRefreshTokenById).toHaveBeenCalledWith(
        tokenRecord.id,
      );
    });

    it('should update refresh token in DB', () => {
      expect(tokenService.updateRefreshToken).toHaveBeenCalledWith({
        userId: tokenRecord.user.id,
        refreshToken: tokens.refreshToken,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
      });
    });

    it('should return tokens', () => {
      expect(result).toEqual(tokens);
    });
  });

  describe('logout', () => {
    const payload: LogoutPayload = {
      refreshToken: 'refresh',
    };

    beforeEach(async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({} as JwtPayload);
      await authService.logout(payload);
    });

    it('should call tokenService to verify refresh token', () => {
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        payload.refreshToken,
      );
    });

    it('should throw RpcException when token verification failed', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(null);
      await expect(authService.logout(payload)).rejects.toThrow(RpcException);
    });

    it('should call tokenService to remove refresh token from DB', () => {
      expect(tokenService.removeRefreshToken).toHaveBeenCalledWith(
        payload.refreshToken,
      );
    });
  });

  describe('logoutAll', () => {
    const payload: LogoutPayload = {
      refreshToken: 'refresh',
    };

    beforeEach(async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({} as JwtPayload);
      await authService.logoutAll(payload);
    });

    it('should call tokenService to verify refresh token', () => {
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        payload.refreshToken,
      );
    });

    it('should throw RpcException when token verification failed', async () => {
      tokenService.verifyRefreshToken.mockResolvedValueOnce(null);
      await expect(authService.logoutAll(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should call tokenService to remove all refresh tokens from DB', () => {
      expect(tokenService.removeAllRefreshTokens).toHaveBeenCalledWith(
        payload.refreshToken,
      );
    });
  });

  describe('validateUserOAuth', () => {
    let result: ValidateUserResponse;
    const payload: ValidateUserOAuthPayload = {
      username: 'test',
      email: 'test',
      provider: 'test',
      providerId: 'test',
    };
    const user = {
      id: 1,
      username: 'test',
      email: 'test',
      password: 'hashed',
    } as User;
    const userWithoutPassword = {
      id: 1,
      username: 'test',
      email: 'test',
    } as UserWithoutPassword;

    it('should return user if it already exists with the same OAuth-provider', async () => {
      const oauthUser = {
        id: 1,
        username: 'test',
        email: 'test',
        oauthAccounts: [{ id: 1, provider: 'test', providerId: 'test' }],
      } as UserWithOAuth;
      userServiceClient.send.mockReturnValueOnce(of(oauthUser));
      result = await authService.validateUserOAuth(payload);

      expect(result).toEqual({
        id: 1,
        username: 'test',
        email: 'test',
      });
    });

    it('should check if there is already a user with this email', async () => {
      userServiceClient.send.mockReturnValueOnce(of(null));
      userServiceClient.send.mockReturnValueOnce(of(user));
      userServiceClient.send.mockReturnValueOnce(of(userWithoutPassword));
      result = await authService.validateUserOAuth(payload);

      expect(userServiceClient.send).toHaveBeenCalledWith(
        UserCommands.GetByEmail,
        {
          email: payload.email,
        },
      );
    });

    it('should link user account with OAuth if it exists', async () => {
      userServiceClient.send.mockReturnValueOnce(of(null));
      userServiceClient.send.mockReturnValueOnce(of(user));
      userServiceClient.send.mockReturnValueOnce(of(userWithoutPassword));
      result = await authService.validateUserOAuth(payload);

      expect(userServiceClient.send).toHaveBeenCalledWith(
        UserCommands.LinkWithOAuth,
        {
          userId: user.id,
          provider: payload.provider,
          providerId: payload.providerId,
        },
      );
      expect(userServiceClient.send).not.toHaveBeenCalledWith(
        UserCommands.CreateOAuth,
        expect.anything(),
      );
      expect(result).toEqual(userWithoutPassword);
    });

    it('should create user account with OAuth if it does not exist', async () => {
      userServiceClient.send.mockReturnValueOnce(of(null));
      userServiceClient.send.mockReturnValueOnce(of(null));
      userServiceClient.send.mockReturnValueOnce(of(userWithoutPassword));
      result = await authService.validateUserOAuth(payload);

      expect(userServiceClient.send).not.toHaveBeenCalledWith(
        UserCommands.LinkWithOAuth,
        expect.anything(),
      );
      expect(userServiceClient.send).toHaveBeenCalledWith(
        UserCommands.CreateOAuth,
        {
          username: payload.username,
          email: payload.email,
          provider: payload.provider,
          providerId: payload.providerId,
        },
      );
      expect(result).toEqual(userWithoutPassword);
    });

    it('should throw RpcException when user creation or link with OAuth failed', async () => {
      userServiceClient.send.mockReturnValueOnce(of(null));
      userServiceClient.send.mockReturnValueOnce(of(null));
      userServiceClient.send.mockReturnValueOnce(
        throwError(() => ({
          message: 'Failed',
        })),
      );

      await expect(authService.validateUserOAuth(payload)).rejects.toThrow(
        RpcException,
      );
    });
  });
});
