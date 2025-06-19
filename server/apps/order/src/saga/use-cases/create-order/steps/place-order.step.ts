import { Injectable, Logger } from '@nestjs/common';
import { OrderService } from '../../../../order.service';
import { SagaStep } from '../../../saga-step';
import { OrderSagaContext } from '../../../types/order-saga-ctx.interface';
import { PLACE_ORDER_STEP } from '../constants';

@Injectable()
export class PlaceOrderStep extends SagaStep<OrderSagaContext> {
  readonly name = PLACE_ORDER_STEP;
  private readonly logger = new Logger(PlaceOrderStep.name);

  constructor(private readonly orderService: OrderService) {
    super();
  }

  async invoke(context: OrderSagaContext): Promise<void> {
    // Заказ уже создан в оркестраторе
    this.logger.log(`Order created with ID ${context.order.id}`);
  }

  async compensate(context: OrderSagaContext): Promise<void> {
    this.logger.log(`Cancelling order with ID ${context.order.id}`);
    await this.orderService.cancelOrder(context.order.id);
  }
}
