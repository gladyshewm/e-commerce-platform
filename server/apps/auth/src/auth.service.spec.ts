import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { USER_SERVICE } from '@app/common/constants';
import { of } from 'rxjs';
import { TokenService } from './token.service';
import {
  LoginPayload,
  LoginResponse,
  LogoutPayload,
  RefreshPayload,
  ValidateUserPayload,
  ValidateUserResponse,
} from '@app/common/contracts/auth';
import { User } from '@app/common/contracts/user';
import { TokenEntity, UserEntity } from '@app/common/database/entities';

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
      expect(userServiceClient.send).toHaveBeenCalledWith('get_user_by_name', {
        username: payload.username,
      });
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

  describe('login', () => {
    let result: LoginResponse;
    const payload: LoginPayload = {
      id: 1,
      username: 'test_name',
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
      expect(tokenService.getTokens).toHaveBeenCalledWith(
        payload.id,
        payload.username,
      );
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
      tokenService.verifyRefreshToken.mockResolvedValue({});
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
      expect(tokenService.getTokens).toHaveBeenCalledWith(
        tokenRecord.user.id,
        tokenRecord.user.username,
      );
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
      tokenService.verifyRefreshToken.mockResolvedValue({});
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
      tokenService.verifyRefreshToken.mockResolvedValue({});
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
});
