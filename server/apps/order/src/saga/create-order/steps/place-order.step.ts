import { SagaStep } from './saga-step';
import { PLACE_ORDER_STEP } from '../constants';
import { OrderService } from '../../../order.service';
import { Injectable, Logger } from '@nestjs/common';
import { OrderSagaContext } from '../../order-saga-ctx.interface';

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
