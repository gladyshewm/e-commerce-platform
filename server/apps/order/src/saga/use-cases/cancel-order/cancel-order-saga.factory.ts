import { Inject } from '@nestjs/common';
import { OrderSagaContext } from '../../types/order-saga-ctx.interface';
import { SagaFactory } from '../../types/saga-factory.interface';
import {
  REFUND_STEP,
  RELEASE_ITEMS_STEP,
  UPDATE_STATUS_STEP,
} from './constants';
import { RefundStep } from './steps/refund.step';
import { ReleaseItemsStep } from './steps/release-items.step';
import { UpdateStatusStep } from './steps/update-status.step';
import { SagaStep } from '../../saga-step';

export class CancelOrderSagaFactory implements SagaFactory<OrderSagaContext> {
  constructor(
    @Inject(REFUND_STEP)
    private readonly refundStep: RefundStep,
    @Inject(RELEASE_ITEMS_STEP)
    private readonly releaseItemsStep: ReleaseItemsStep,
    @Inject(UPDATE_STATUS_STEP)
    private readonly updateStatusStep: UpdateStatusStep,
  ) {}

  createSteps(): SagaStep<OrderSagaContext>[] {
    return [this.refundStep, this.releaseItemsStep, this.updateStatusStep];
  }
}
