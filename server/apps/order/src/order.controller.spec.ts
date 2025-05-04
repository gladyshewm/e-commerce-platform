import { Test, TestingModule } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';
import { OrderController } from './order.controller';
import { OrderOrchestrator } from './saga/order.orchestrator';
import { RmqService } from '@app/rmq';
import { Order } from '@app/common/contracts/order';
import { CreateOrderDto } from './dto/order-create.dto';

jest.mock('./saga/order.orchestrator');

describe('OrderController', () => {
  let orderController: OrderController;
  let orderOrchestrator: jest.Mocked<OrderOrchestrator>;
  let rmqService: jest.Mocked<RmqService>;
  const ctx = {} as RmqContext;

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
    orderOrchestrator =
      app.get<jest.Mocked<OrderOrchestrator>>(OrderOrchestrator);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(orderController).toBeDefined();
    });
  });

  describe('createOrder', () => {
    let result: Order;
    const payload: CreateOrderDto = {
      userId: 1,
      items: [{ productId: 2, quantity: 50 }],
    };
    const order = {
      id: 22,
      totalAmount: 2000,
      items: payload.items,
    } as Order;

    beforeEach(async () => {
      orderOrchestrator.createOrder.mockResolvedValue(order);
      result = await orderController.createOrder(payload, ctx);
    });

    it('should call orderOrchestrator', () => {
      expect(orderOrchestrator.createOrder).toHaveBeenCalledWith(payload);
    });

    it('should return created order', () => {
      expect(result).toEqual(order);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
    });
  });
});
