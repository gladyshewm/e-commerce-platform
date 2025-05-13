import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { UserRole } from '@app/common/database/enums';
import { AuthenticatedUser } from '../types';
import { HttpException } from '@nestjs/common';
import { GoogleStrategy } from './google.strategy';
import { Profile } from 'passport-google-oauth20';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let configService: jest.Mocked<ConfigService>;
  let authService: jest.Mocked<ClientProxy>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const env = {
          GOOGLE_CLIENT_ID: 'test-client-id',
          GOOGLE_CLIENT_SECRET: 'test-client-secret',
          callbackURL: 'http://localhost/google/test-callback',
        };
        return env[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;
    authService = {
      send: jest.fn(),
      pipe: jest.fn(),
    } as unknown as jest.Mocked<ClientProxy>;

    strategy = new GoogleStrategy(configService, authService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    let result: AuthenticatedUser;
    const accessToken = 'test-access-token';
    const refreshToken = 'test-refresh-token';
    const profile = {
      id: 'test-user-id',
      name: { givenName: 'John', familyName: 'Doe' },
      emails: [{ value: 'test-email@example.com' }],
    } as Profile;
    const user = {
      id: 123,
      username: 'john',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
    } as UserWithoutPassword;

    it('should return an authenticated user', async () => {
      authService.send.mockReturnValue(of(user));
      result = await strategy.validate(accessToken, refreshToken, profile);
      expect(result).toEqual({
        id: user.id,
        username: user.username,
        role: user.role,
      });
    });

    it('should throw HttpException on upstream error', async () => {
      const upstream = { message: 'bad', statusCode: 401 };
      authService.send.mockReturnValue(throwError(() => upstream));

      await expect(
        strategy.validate(accessToken, refreshToken, profile),
      ).rejects.toThrow(HttpException);
      expect(authService.send).toHaveBeenCalled();
    });
  });
});
