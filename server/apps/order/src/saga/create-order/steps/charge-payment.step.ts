import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { CHARGE_PAYMENT_STEP } from '../constants';
import { OrderSagaContext } from '../../order-saga-ctx.interface';
import { SagaStep } from './saga-step';
import {
  ChargePaymentPayload,
  PaymentTransaction,
} from '@app/common/contracts/payment';
import { catchError, lastValueFrom } from 'rxjs';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderStatus, PaymentStatus } from '@app/common/database/enums';
import { OrderService } from '../../../order.service';
import { PAYMENT_SERVICE } from '@app/common/constants';

@Injectable()
export class ChargePaymentStep extends SagaStep<OrderSagaContext> {
  readonly name = CHARGE_PAYMENT_STEP;
  private readonly logger = new Logger(ChargePaymentStep.name);

  constructor(
    @Inject(PAYMENT_SERVICE)
    private readonly paymentServiceClient: ClientProxy,
    private readonly orderService: OrderService,
  ) {
    super();
  }

  async invoke(context: OrderSagaContext): Promise<void> {
    this.logger.log(`Charging payment for order with ID ${context.order.id}`);
    const payload: ChargePaymentPayload = {
      orderId: context.order.id,
      userId: context.userId,
      amount: context.order.totalAmount,
      currency: 'RUB',
    };

    const result = await lastValueFrom<PaymentTransaction>(
      this.paymentServiceClient.send('charge_payment', payload).pipe(
        catchError((error) => {
          throw new RpcException({
            message: error.message,
            statusCode: error.statusCode,
          });
        }),
      ),
    );

    if (result.status !== PaymentStatus.SUCCEEDED) {
      throw new RpcException({
        message: 'Payment failed',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const updatedOrder = await this.orderService.updateOrderStatus(
      context.order.id,
      OrderStatus.PAID,
    );
    context.order = updatedOrder;
  }

  async compensate(context: OrderSagaContext): Promise<void> {
    this.logger.log(`Refunding payment for order with ID ${context.order.id}`);

    await lastValueFrom(
      this.paymentServiceClient.send('refund_payment', {
        orderId: context.order.id,
      }),
    );
  }
}
