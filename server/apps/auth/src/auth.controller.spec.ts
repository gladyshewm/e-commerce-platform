import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RmqService } from '@app/rmq';
import { USER_SERVICE } from '@app/common/constants';
import { of } from 'rxjs';
import { ClientProxy, RmqContext } from '@nestjs/microservices';
import {
  LoginResponse,
  RegisterResponse,
  ValidateUserPayload,
  ValidateUserResponse,
} from '@app/common/contracts/auth';
import { RegisterDto } from './dto/auth-register.dto';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { LoginDto } from './dto/auth-login.dto';
import { RefreshDto } from './dto/auth-refresh.dto';
import { LogoutDto } from './dto/auth-logout.dto';
import { UserRole } from '@app/common/database/enums';

jest.mock('./auth.service');

describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;
  let rmqService: jest.Mocked<RmqService>;
  let userServiceClient: jest.Mocked<ClientProxy>;
  let ctx: RmqContext;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: RmqService,
          useValue: {
            ack: jest.fn(),
          },
        },
        {
          provide: USER_SERVICE,
          useValue: {
            send: jest.fn().mockReturnValue(of({})),
            pipe: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
    }).compile();

    authController = app.get<AuthController>(AuthController);
    authService = app.get<jest.Mocked<AuthService>>(AuthService);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
    userServiceClient = app.get<jest.Mocked<ClientProxy>>(USER_SERVICE);
    ctx = {} as RmqContext;
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(authController).toBeDefined();
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
    } as ValidateUserResponse;

    beforeEach(async () => {
      authService.validateUser.mockResolvedValue(user);
      result = await authController.validateUser(payload, ctx);
    });

    it('should call authService', () => {
      expect(authService.validateUser).toHaveBeenCalledWith(payload);
    });

    it('should return validated user', () => {
      expect(result).toEqual(user);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('register', () => {
    let result: RegisterResponse;
    const payload: RegisterDto = {
      username: 'test',
      email: 'test',
      password: 'test',
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    };
    const user = {
      id: 1,
      username: 'test',
      email: 'test',
    } as UserWithoutPassword;
    const loginResponse: LoginResponse = {
      accessToken: 'access',
      refreshToken: 'refresh',
    };

    beforeEach(async () => {
      userServiceClient.send.mockReturnValue(of(user));
      authService.login.mockResolvedValue(loginResponse);
      result = await authController.register(payload, ctx);
    });

    it('should call userServiceClient', () => {
      const { ipAddress, userAgent, ...credentials } = payload;
      expect(userServiceClient.send).toHaveBeenCalledWith(
        'create_user',
        credentials,
      );
    });

    it('should call authService', () => {
      expect(authService.login).toHaveBeenCalledWith({
        ...user,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
      });
    });

    it('should return user with tokens', () => {
      expect(result).toEqual({
        user,
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
      });
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('login', () => {
    let result: LoginResponse;
    const payload: LoginDto = {
      id: 1,
      username: 'test',
      role: UserRole.CUSTOMER,
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    };
    const tokens: LoginResponse = {
      accessToken: 'access',
      refreshToken: 'refresh',
    };

    beforeEach(async () => {
      authService.login.mockResolvedValue(tokens);
      result = await authController.login(payload, ctx);
    });

    it('should call authService', () => {
      expect(authService.login).toHaveBeenCalledWith(payload);
    });

    it('should return tokens', () => {
      expect(result).toEqual(tokens);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('refresh', () => {
    let result: LoginResponse;
    const payload: RefreshDto = {
      refreshToken: 'refresh',
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    };
    const tokens: LoginResponse = {
      accessToken: 'access',
      refreshToken: 'refresh',
    };

    beforeEach(async () => {
      authService.refresh.mockResolvedValue(tokens);
      result = await authController.refresh(payload, ctx);
    });

    it('should call authService', () => {
      expect(authService.refresh).toHaveBeenCalledWith(payload);
    });

    it('should return tokens', () => {
      expect(result).toEqual(tokens);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('logout', () => {
    let result: { success: boolean };
    const payload: LogoutDto = {
      refreshToken: 'refresh',
    };

    beforeEach(async () => {
      result = await authController.logout(payload, ctx);
    });

    it('should call authService', () => {
      expect(authService.logout).toHaveBeenCalledWith(payload);
    });

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('logoutAll', () => {
    let result: { success: boolean };
    const payload: LogoutDto = {
      refreshToken: 'refresh',
    };

    beforeEach(async () => {
      result = await authController.logoutAll(payload, ctx);
    });

    it('should call authService', () => {
      expect(authService.logoutAll).toHaveBeenCalledWith(payload);
    });

    it('should return success', () => {
      expect(result).toEqual({ success: true });
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });
});
