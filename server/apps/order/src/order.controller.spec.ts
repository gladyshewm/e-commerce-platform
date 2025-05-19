import { Test, TestingModule } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';
import { OrderController } from './order.controller';
import { OrderOrchestrator } from './saga/order.orchestrator';
import { RmqService } from '@app/rmq';
import { Order } from '@app/common/contracts/order';
import { CreateOrderDto } from './dto/order-create.dto';
import { OrderService } from './order.service';
import { OrderShippedDto } from './dto/order-shipped.dto';
import { OrderStatus } from '@app/common/database/enums';

jest.mock('./saga/order.orchestrator');
jest.mock('./order.service');

describe('OrderController', () => {
  let orderController: OrderController;
  let orderOrchestrator: jest.Mocked<OrderOrchestrator>;
  let orderService: jest.Mocked<OrderService>;
  let rmqService: jest.Mocked<RmqService>;
  const ctx = {} as RmqContext;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderOrchestrator,
        OrderService,
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
    orderService = app.get<jest.Mocked<OrderService>>(OrderService);
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

  describe('onShipped', () => {
    const payload: OrderShippedDto = {
      orderId: 1,
    };

    beforeEach(async () => {
      await orderController.onShipped(payload, ctx);
    });

    it('should call orderService', () => {
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        payload.orderId,
        OrderStatus.SHIPPED,
      );
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
    });
  });

  describe('onDelivered', () => {
    const payload: OrderShippedDto = {
      orderId: 1,
    };

    beforeEach(async () => {
      await orderController.onDelivered(payload, ctx);
    });

    it('should call orderService', () => {
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        payload.orderId,
        OrderStatus.DELIVERED,
      );
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
    });
  });
});
