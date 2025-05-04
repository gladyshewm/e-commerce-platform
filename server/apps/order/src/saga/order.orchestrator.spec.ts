import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { OrderOrchestrator } from './order.orchestrator';
import { OrderService } from '../order.service';
import { CreateOrderSagaFactory } from './create-order/create-order-saga.factory';
import { SagaManager } from './saga.manager';
import { SagaStep } from './create-order/steps/saga-step';
import { OrderSagaContext } from './types/order-saga-ctx.interface';
import { DELIVERY_SERVICE, NOTIFICATION_SERVICE } from '@app/common/constants';
import { CreateOrderPayload, Order } from '@app/common/contracts/order';

jest.mock('../order.service');
jest.mock('./create-order/create-order-saga.factory');
jest.mock('./saga.manager', () => ({
  SagaManager: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
  })),
}));

describe('OrderOrchestrator', () => {
  let orderOrchestrator: OrderOrchestrator;
  let orderService: jest.Mocked<OrderService>;
  let createOrderSagaFactory: jest.Mocked<CreateOrderSagaFactory>;
  let deliveryServiceClient: jest.Mocked<ClientProxy>;
  let notificationServiceClient: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        OrderOrchestrator,
        OrderService,
        CreateOrderSagaFactory,
        {
          provide: DELIVERY_SERVICE,
          useValue: {
            emit: jest.fn().mockReturnValue(of({})),
            subscribe: jest.fn().mockReturnValue(of({})),
          },
        },
        {
          provide: NOTIFICATION_SERVICE,
          useValue: {
            emit: jest.fn().mockReturnValue(of({})),
            subscribe: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
    }).compile();

    orderOrchestrator = app.get<OrderOrchestrator>(OrderOrchestrator);
    orderService = app.get<jest.Mocked<OrderService>>(OrderService);
    createOrderSagaFactory = app.get<jest.Mocked<CreateOrderSagaFactory>>(
      CreateOrderSagaFactory,
    );
    deliveryServiceClient = app.get<jest.Mocked<ClientProxy>>(DELIVERY_SERVICE);
    notificationServiceClient =
      app.get<jest.Mocked<ClientProxy>>(NOTIFICATION_SERVICE);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(orderOrchestrator).toBeDefined();
    });
  });

  describe('createOrder', () => {
    let result: Order;
    const payload: CreateOrderPayload = {
      userId: 22,
      items: [
        {
          quantity: 22,
          productId: 15,
        },
      ],
    };
    const order = {
      id: 22,
      totalAmount: 2000,
      items: payload.items,
    } as Order;
    const steps = ['step1', 'step2'] as unknown as SagaStep<OrderSagaContext>[];
    const mockExecute = jest.fn();

    beforeEach(async () => {
      orderService.createOrder.mockResolvedValue(order);
      createOrderSagaFactory.createSteps.mockReturnValue(steps);
      (SagaManager as jest.Mock).mockImplementationOnce(() => ({
        execute: mockExecute,
      }));

      result = await orderOrchestrator.createOrder(payload);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create order and save it in DB', () => {
      expect(orderService.createOrder).toHaveBeenCalledWith(payload);
    });

    it('should create saga steps', () => {
      expect(createOrderSagaFactory.createSteps).toHaveBeenCalled();
    });

    it('should create saga', () => {
      expect(SagaManager).toHaveBeenCalledWith(steps);
    });

    it('should execute saga steps', () => {
      expect(mockExecute).toHaveBeenCalledWith({ order });
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should emit order_created event for the delivery service', () => {
      expect(deliveryServiceClient.emit).toHaveBeenCalledWith('order_created', {
        orderId: order.id,
      });
    });

    it('should emit order_created event for the notification service', () => {
      expect(notificationServiceClient.emit).toHaveBeenCalledWith(
        'order_created',
        {
          userId: order.userId,
          orderId: order.id,
        },
      );
    });

    it('should return created order', () => {
      expect(result).toEqual(order);
    });

    it('should throw error if SagaManager throws', async () => {
      (SagaManager as jest.Mock).mockImplementationOnce(() => ({
        execute: jest.fn().mockRejectedValue(new Error()),
      }));
      await expect(orderOrchestrator.createOrder(payload)).rejects.toThrow(
        Error,
      );
    });
  });
});
