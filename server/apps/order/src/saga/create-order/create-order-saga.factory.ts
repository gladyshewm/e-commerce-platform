import { Inject } from '@nestjs/common';
import { OrderSagaContext } from '../order-saga-ctx.interface';
import { SagaFactory } from '../saga-factory.interface';
import { SagaStep } from './steps/saga-step';
import {
  CHARGE_PAYMENT_STEP,
  COMMIT_RESERVE_STEP,
  PLACE_ORDER_STEP,
  RESERVE_ITEMS_STEP,
} from './constants';
import { PlaceOrderStep } from './steps/place-order.step';
import { ReserveItemsStep } from './steps/reserve-items.step';
import { ChargePaymentStep } from './steps/charge-payment.step';
import { CommitReserveStep } from './steps/commit-reserve.step';

export class CreateOrderSagaFactory implements SagaFactory<OrderSagaContext> {
  constructor(
    @Inject(PLACE_ORDER_STEP)
    private readonly placeOrderStep: PlaceOrderStep,
    @Inject(RESERVE_ITEMS_STEP)
    private readonly reserveItemsStep: ReserveItemsStep,
    @Inject(CHARGE_PAYMENT_STEP)
    private readonly chargePaymentStep: ChargePaymentStep,
    @Inject(COMMIT_RESERVE_STEP)
    private readonly commitReserveStep: CommitReserveStep,
  ) {}

  createSteps(): SagaStep<OrderSagaContext>[] {
    return [
      this.placeOrderStep,
      this.reserveItemsStep,
      this.chargePaymentStep,
      this.commitReserveStep,
    ];
  }
}
