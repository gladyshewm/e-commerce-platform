import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  CancelOrderPayload,
  CreateOrderPayload,
  Order,
} from '@app/common/contracts/order';
import { DELIVERY_SERVICE, NOTIFICATION_SERVICE } from '@app/common/constants';
import { OrderEvents } from '@app/common/messaging';
import { OrderStatus } from '@app/common/database/enums';
import { SagaManager } from './saga.manager';
import { OrderService } from '../order.service';
import { OrderSagaContext } from './types/order-saga-ctx.interface';
import { CreateOrderSagaFactory } from './use-cases/create-order/create-order-saga.factory';
import { CancelOrderSagaFactory } from './use-cases/cancel-order/cancel-order-saga.factory';

@Injectable()
export class OrderOrchestrator {
  constructor(
    private readonly orderService: OrderService,
    private readonly createOrderSagaFactory: CreateOrderSagaFactory,
    private readonly cancelOrderSagaFactory: CancelOrderSagaFactory,
    @Inject(DELIVERY_SERVICE)
    private readonly deliveryServiceClient: ClientProxy,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationServiceClient: ClientProxy,
  ) {}

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const order = await this.orderService.createOrder(payload);
    const context: OrderSagaContext = { order };

    const steps = this.createOrderSagaFactory.createSteps();
    const saga = new SagaManager<OrderSagaContext>(steps);

    try {
      await saga.execute(context);

      // FIXME:
      this.deliveryServiceClient
        .emit(OrderEvents.Created, {
          userId: order.userId,
          orderId: order.id,
        })
        .subscribe();

      this.notificationServiceClient
        .emit(OrderEvents.Created, {
          userId: order.userId,
          orderId: order.id,
        })
        .subscribe();

      return context.order;
    } catch (error) {
      throw error;
    }
  }

  async cancelOrder(payload: CancelOrderPayload): Promise<Order> {
    const order = await this.orderService.findOrder(payload.orderId);
    if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status)) {
      throw new RpcException({
        message: `Order with ID ${order.id} cannot be cancelled in status ${order.status}`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const context: OrderSagaContext = { order };
    const steps = this.cancelOrderSagaFactory.createSteps();
    const saga = new SagaManager<OrderSagaContext>(steps);

    try {
      await saga.execute(context);

      this.notificationServiceClient
        .emit(OrderEvents.Cancelled, {
          userId: order.userId,
          orderId: order.id,
        })
        .subscribe();

      return context.order;
    } catch (error) {
      throw error;
    }
  }
}
