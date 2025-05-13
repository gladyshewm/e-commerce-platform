import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { UserRole } from '@app/common/database/enums';
import { AuthenticatedUser } from '../types';
import { HttpException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<ClientProxy>;

  beforeEach(() => {
    authService = {
      send: jest.fn(),
      pipe: jest.fn(),
    } as unknown as jest.Mocked<ClientProxy>;

    strategy = new LocalStrategy(authService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    let result: AuthenticatedUser;
    const username = 'test-username';
    const password = 'test-password';
    const user = {
      id: 123,
      username: 'john',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
    } as UserWithoutPassword;

    it('should return an authenticated user', async () => {
      authService.send.mockReturnValue(of(user));
      result = await strategy.validate(username, password);
      expect(result).toEqual({
        id: user.id,
        username: user.username,
        role: user.role,
      });
    });

    it('should throw HttpException on upstream error', async () => {
      const upstream = { message: 'bad', statusCode: 401 };
      authService.send.mockReturnValue(throwError(() => upstream));

      await expect(strategy.validate(username, password)).rejects.toThrow(
        HttpException,
      );
      expect(authService.send).toHaveBeenCalled();
    });
  });
});
