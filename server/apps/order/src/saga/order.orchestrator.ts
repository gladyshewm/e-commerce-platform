import { Injectable } from '@nestjs/common';
import { CreateOrderPayload, Order } from '@app/common/contracts/order';
import { SagaManager } from './saga-manager';
import { OrderService } from '../order.service';
import { OrderSagaContext } from './order-saga-ctx.interface';
import { CreateOrderSagaFactory } from './create-order/create-order-saga.factory';

@Injectable()
export class OrderOrchestrator {
  constructor(
    private readonly orderService: OrderService,
    private readonly createOrderSagaFactory: CreateOrderSagaFactory,
  ) {}

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const order = await this.orderService.createOrder(payload);

    const context: OrderSagaContext = {
      order,
      userId: payload.userId,
    };

    // this.shipmentServiceClient.emit('order_created', { orderId: order.id }); TODO:

    const steps = this.createOrderSagaFactory.createSteps();
    const saga = new SagaManager<OrderSagaContext>(steps);

    try {
      await saga.execute(context);
      return context.order;
    } catch (error) {
      throw error;
    }
  }
}
