import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RmqService } from '@app/rmq';
import { USER_SERVICE } from '@app/common/constants';
import { of } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

jest.mock('./auth.service');

describe('AuthController', () => {
  let authController: AuthController;
  let rmqService: jest.Mocked<RmqService>;
  let userServiceClient: jest.Mocked<ClientProxy>;

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
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
    userServiceClient = app.get<jest.Mocked<ClientProxy>>(USER_SERVICE);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(authController).toBeDefined();
    });
  });
});
