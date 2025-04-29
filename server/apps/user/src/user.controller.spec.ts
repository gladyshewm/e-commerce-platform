import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RmqService } from '@app/rmq';

jest.mock('./user.service');

describe('UserController', () => {
  let userController: UserController;
  let rmqService: jest.Mocked<RmqService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: RmqService,
          useValue: {
            ack: jest.fn(),
          },
        },
      ],
    }).compile();

    userController = app.get<UserController>(UserController);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(userController).toBeDefined();
    });
  });
});
