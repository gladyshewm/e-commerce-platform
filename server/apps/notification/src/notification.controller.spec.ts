import { Test, TestingModule } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';
import { NotificationController } from './notification.controller';
import { RmqService } from '@app/rmq';
import { NotificationService } from './services';

jest.mock('./services');

describe('NotificationController', () => {
  let notificationController: NotificationController;
  let notificationService: jest.Mocked<NotificationService>;
  let rmqService: jest.Mocked<RmqService>;
  const ctx = {} as RmqContext;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        NotificationService,
        {
          provide: RmqService,
          useValue: {
            ack: jest.fn(),
          },
        },
      ],
    }).compile();

    notificationController = app.get<NotificationController>(
      NotificationController,
    );
    notificationService =
      app.get<jest.Mocked<NotificationService>>(NotificationService);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(notificationController).toBeDefined();
    });
  });
});
