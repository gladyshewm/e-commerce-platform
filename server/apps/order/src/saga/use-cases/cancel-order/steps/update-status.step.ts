import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@app/common/database/enums';
import { SagaStep } from '../../../saga-step';
import { OrderSagaContext } from '../../../types/order-saga-ctx.interface';
import { UPDATE_STATUS_STEP } from '../constants';
import { OrderService } from '../../../../order.service';

@Injectable()
export class UpdateStatusStep extends SagaStep<OrderSagaContext> {
  readonly name = UPDATE_STATUS_STEP;
  private readonly logger = new Logger(UpdateStatusStep.name);

  constructor(private readonly orderService: OrderService) {
    super();
  }

  async invoke(context: OrderSagaContext): Promise<void> {
    this.logger.log(
      `Updating status to CANCELLED for order with ID ${context.order.id}`,
    );
    context.previousStatus = context.order.status;
    const updated = await this.orderService.updateOrderStatus(
      context.order.id,
      OrderStatus.CANCELLED,
    );
    context.order = updated;
  }

  async compensate(context: OrderSagaContext): Promise<void> {
    this.logger.log(
      `Reverting status back to ${context.previousStatus} for order with ID ${context.order.id}`,
    );
    if (!context.previousStatus) return;
    const reverted = await this.orderService.updateOrderStatus(
      context.order.id,
      context.previousStatus,
    );
    context.order = reverted;
  }
}
