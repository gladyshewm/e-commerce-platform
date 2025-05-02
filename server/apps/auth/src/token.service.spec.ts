import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';
import { LessThan, Repository } from 'typeorm';
import { TokenEntity, UserEntity } from '@app/common/database/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginResponse, RefreshPayload } from '@app/common/contracts/auth';
import { JwtPayload } from './types/jwt-payload.interface';

jest.mock('bcrypt');

describe('TokenService', () => {
  let tokenService: TokenService;
  let tokenRepository: jest.Mocked<Repository<TokenEntity>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const config = (key: string): string => {
    const configMap = {
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_ACCESS_SECRET_EXPIRATION_TIME: '1h',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_REFRESH_SECRET_EXPIRATION_TIME: '7d',
    };
    return configMap[key];
  };

  const jwtSign = (_, options: JwtSignOptions) => {
    if (options.secret === 'access-secret') {
      return Promise.resolve('mock-access-token');
    }
    if (options.secret === 'refresh-secret') {
      return Promise.resolve('mock-refresh-token');
    }
    return Promise.reject('Unexpected secret');
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: getRepositoryToken(TokenEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(async (entity) => entity as TokenEntity),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockImplementation(jwtSign),
            verifyAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation(config),
          },
        },
      ],
    }).compile();

    tokenService = app.get<TokenService>(TokenService);
    tokenRepository = app.get<jest.Mocked<Repository<TokenEntity>>>(
      getRepositoryToken(TokenEntity),
    );
    jwtService = app.get<jest.Mocked<JwtService>>(JwtService);
    configService = app.get<jest.Mocked<ConfigService>>(ConfigService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(tokenService).toBeDefined();
    });
  });

  describe('cleanExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
      await tokenService.cleanExpiredTokens();

      expect(tokenRepository.delete).toHaveBeenCalledWith({
        expiresAt: LessThan(new Date()),
      });

      jest.useRealTimers();
    });
  });

  describe('getTokens', () => {
    let result: LoginResponse;
    const [userId, username] = [1, 'test'];

    beforeEach(async () => {
      result = await tokenService.getTokens(userId, username);
    });

    it('should generate access and refresh tokens', () => {
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { userId, username },
        { secret: 'access-secret', expiresIn: '1h' },
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { userId, username },
        { secret: 'refresh-secret', expiresIn: '7d' },
      );
    });

    it('should get secrets and expiration times from config', () => {
      expect(configService.get).toHaveBeenCalledTimes(4);
      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
      expect(configService.get).toHaveBeenCalledWith(
        'JWT_ACCESS_SECRET_EXPIRATION_TIME',
      );
      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
      expect(configService.get).toHaveBeenCalledWith(
        'JWT_REFRESH_SECRET_EXPIRATION_TIME',
      );
    });

    it('should return tokens', () => {
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });
  });

  describe('verifyAccessToken', () => {
    let result: JwtPayload | null;
    const token = 'mock-access-token';
    const jwtPayload: JwtPayload = {
      userId: 1,
      username: 'test',
      iat: 1,
      exp: 2,
    };

    beforeEach(async () => {
      jwtService.verifyAsync.mockResolvedValue(jwtPayload);
      result = await tokenService.verifyAccessToken(token);
    });

    it('should verify access token', () => {
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'access-secret',
      });
    });

    it('should return token data', () => {
      expect(result).toEqual(jwtPayload);
    });

    it('should return null if verification fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));
      result = await tokenService.verifyAccessToken(token);
      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    let result: JwtPayload | null;
    const token = 'mock-refresh-token';
    const jwtPayload: JwtPayload = {
      userId: 1,
      username: 'test',
      iat: 1,
      exp: 222,
    };

    beforeEach(async () => {
      jwtService.verifyAsync.mockResolvedValue(jwtPayload);
      result = await tokenService.verifyRefreshToken(token);
    });

    it('should verify refresh token', () => {
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'refresh-secret',
      });
    });

    it('should return token data', () => {
      expect(result).toEqual(jwtPayload);
    });

    it('should return null if verification fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));
      result = await tokenService.verifyRefreshToken(token);
      expect(result).toBeNull();
    });
  });

  describe('findToken', () => {
    let result: TokenEntity | null;
    const token = 'mock-refresh-token';
    const tokens: TokenEntity[] = [
      {
        id: 1,
        refreshToken: token,
        expiresAt: new Date('2099-01-01'),
        createdAt: new Date(),
        user: { id: 1 } as UserEntity,
      },
      {
        id: 2,
        refreshToken: 'mock2',
        expiresAt: new Date('2099-01-01'),
        createdAt: new Date(),
        user: { id: 1 } as UserEntity,
      },
    ];
    const jwtPayload: JwtPayload = {
      userId: 1,
      username: 'test',
      iat: 1,
      exp: 222,
    };

    beforeEach(async () => {
      tokenRepository.find.mockResolvedValue(tokens);
      jwtService.decode.mockReturnValue(jwtPayload);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should decode token and get user ID from it', async () => {
      await tokenService.findToken(token);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
    });

    it('should return null if token decode returns not a valid payload', async () => {
      jwtService.decode.mockReturnValueOnce(null);
      result = await tokenService.findToken(token);
      expect(result).toBeNull();
    });

    it('should return null if user ID not found in token', async () => {
      jwtService.decode.mockReturnValueOnce({ ...jwtPayload, userId: null });
      result = await tokenService.findToken(token);
      expect(result).toBeNull();
    });

    it('should compare refreshToken with refreshTokens from DB', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await tokenService.findToken(token);

      expect(bcrypt.compare).toHaveBeenCalledTimes(tokens.length);
      for (const DBtoken of tokens) {
        expect(bcrypt.compare).toHaveBeenCalledWith(
          token,
          DBtoken.refreshToken,
        );
      }
    });

    it('should return the matching token when found', async () => {
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      const result = await tokenService.findToken(token);

      expect(result).toEqual(tokens[1]);
    });

    it('should return null when no tokens match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      result = await tokenService.findToken(token);

      expect(result).toBeNull();
    });
  });

  describe('updateRefreshToken', () => {
    const payload: RefreshPayload & { userId: number } = {
      userId: 1,
      refreshToken: 'mock-refresh',
      ipAddress: '127.0.0.1',
      userAgent: 'mock-agent',
    };
    const token: TokenEntity = {
      id: 1,
      refreshToken: 'hashed-refresh',
      expiresAt: new Date('2099-01-01'),
      createdAt: new Date(),
      user: { id: 1 } as UserEntity,
    };

    beforeEach(async () => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      tokenRepository.create.mockReturnValue(token);
      await tokenService.updateRefreshToken(payload);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should hash refresh token', () => {
      expect(bcrypt.hash).toHaveBeenCalledWith(
        payload.refreshToken,
        expect.any(Number),
      );
    });

    it('should save a new hashed refresh token in DB', () => {
      expect(tokenRepository.save).toHaveBeenCalledWith(token);
    });
  });

  describe('removeRefreshToken', () => {
    const refreshToken = 'mock-refresh-token';
    const token: TokenEntity = {
      id: 1,
      refreshToken: 'hashed-refresh',
      expiresAt: new Date('2099-01-01'),
      createdAt: new Date(),
      user: { id: 1 } as UserEntity,
    };

    beforeEach(async () => {
      jest.spyOn(tokenService, 'findToken').mockResolvedValue(token);
    });

    it('should find refresh token', async () => {
      await tokenService.removeRefreshToken(refreshToken);
      expect(tokenService.findToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should return if token not found', async () => {
      jest.spyOn(tokenService, 'findToken').mockResolvedValue(null);
      await tokenService.removeRefreshToken(refreshToken);
      expect(tokenRepository.delete).not.toHaveBeenCalled();
    });

    it('should remove refresh token', async () => {
      await tokenService.removeRefreshToken(refreshToken);
      expect(tokenRepository.delete).toHaveBeenCalledWith({ id: token.id });
    });
  });

  describe('removeRefreshTokenById', () => {
    const refreshTokenId = 1;

    it('should remove refresh token by ID', async () => {
      await tokenService.removeRefreshTokenById(refreshTokenId);
      expect(tokenRepository.delete).toHaveBeenCalledWith({
        id: refreshTokenId,
      });
    });
  });

  describe('removeAllRefreshTokens', () => {
    const refreshToken = 'mock-refresh-token';
    const jwtPayload: JwtPayload = {
      userId: 1,
      username: 'test',
      iat: 1,
      exp: 222,
    };

    it('should decode token and get user ID from it', async () => {
      jwtService.decode.mockReturnValue(jwtPayload);
      await tokenService.removeAllRefreshTokens(refreshToken);
      expect(jwtService.decode).toHaveBeenCalledWith(refreshToken);
    });

    it('should return if token decode returns not a valid payload', async () => {
      jwtService.decode.mockReturnValue(null);
      await tokenService.removeAllRefreshTokens(refreshToken);
      expect(tokenRepository.delete).not.toHaveBeenCalled();
    });

    it('should return if user ID not found in token', async () => {
      jwtService.decode.mockReturnValue({ ...jwtPayload, userId: null });
      await tokenService.removeAllRefreshTokens(refreshToken);
      expect(tokenRepository.delete).not.toHaveBeenCalled();
    });

    it('should remove all refresh tokens', async () => {
      jwtService.decode.mockReturnValue(jwtPayload);
      await tokenService.removeAllRefreshTokens(refreshToken);
      expect(tokenRepository.delete).toHaveBeenCalledWith({
        user: { id: jwtPayload.userId },
      });
    });
  });
});
