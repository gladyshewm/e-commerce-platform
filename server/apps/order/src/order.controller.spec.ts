import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { RmqService } from '@app/rmq';
import { OrderOrchestrator } from './saga/order.orchestrator';

jest.mock('./saga/order.orchestrator');

describe('OrderController', () => {
  let orderController: OrderController;
  let rmqService: jest.Mocked<RmqService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderOrchestrator,
        {
          provide: RmqService,
          useValue: {
            ack: jest.fn(),
          },
        },
      ],
    }).compile();

    orderController = app.get<OrderController>(OrderController);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(orderController).toBeDefined();
    });
  });
});
