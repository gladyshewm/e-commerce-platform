import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderPayload, Order } from '@app/common/contracts/order';
import { SagaManager } from './saga-manager';
import { OrderService } from '../order.service';
import { OrderSagaContext } from './order-saga-ctx.interface';
import { CreateOrderSagaFactory } from './create-order/create-order-saga.factory';
import { DELIVERY_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrderOrchestrator {
  constructor(
    private readonly orderService: OrderService,
    private readonly createOrderSagaFactory: CreateOrderSagaFactory,
    @Inject(DELIVERY_SERVICE)
    private readonly deliveryServiceClient: ClientProxy,
  ) {}

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const order = await this.orderService.createOrder(payload);

    const context: OrderSagaContext = {
      order,
      userId: payload.userId,
    };

    const steps = this.createOrderSagaFactory.createSteps();
    const saga = new SagaManager<OrderSagaContext>(steps);

    try {
      await saga.execute(context);

      this.deliveryServiceClient
        .emit('order_created', {
          orderId: order.id,
        })
        .subscribe();

      // TODO: notify

      return context.order;
    } catch (error) {
      throw error;
    }
  }
}
