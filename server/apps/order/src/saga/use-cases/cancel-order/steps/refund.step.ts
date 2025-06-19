import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import { PAYMENT_SERVICE } from '@app/common/constants';
import { PaymentCommands } from '@app/common/messaging';
import {
  PaymentRefundPayload,
  PaymentTransaction,
} from '@app/common/contracts/payment';
import { PaymentStatus } from '@app/common/database/enums';
import { SagaStep } from '../../../saga-step';
import { OrderSagaContext } from '../../../types/order-saga-ctx.interface';
import { REFUND_STEP } from '../constants';

@Injectable()
export class RefundStep extends SagaStep<OrderSagaContext> {
  readonly name = REFUND_STEP;
  private readonly logger = new Logger(RefundStep.name);

  constructor(
    @Inject(PAYMENT_SERVICE)
    private readonly paymentServiceClient: ClientProxy,
  ) {
    super();
  }

  async invoke(context: OrderSagaContext): Promise<void> {
    this.logger.log(`Refunding payment for order with ID ${context.order.id}`);
    const payload: PaymentRefundPayload = { orderId: context.order.id };

    const result = await lastValueFrom(
      this.paymentServiceClient
        .send<PaymentTransaction>(PaymentCommands.Refund, payload)
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              statusCode: error.statusCode,
            });
          }),
        ),
    );

    if (result.status !== PaymentStatus.REFUNDED) {
      throw new RpcException({
        message: 'Refund failed',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async compensate(context: OrderSagaContext): Promise<void> {
    this.logger.log(
      `No compensation for refund step for order with ID ${context.order.id}`,
    );
  }
}
