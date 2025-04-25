import { PaymentRefundPayload } from '@app/common/contracts/payment';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class RefundPaymentDto implements PaymentRefundPayload {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
