import { CancelOrderPayload } from '@app/common/contracts/order';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CancelOrderDto implements CancelOrderPayload {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
