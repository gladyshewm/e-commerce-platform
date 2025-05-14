import { IsNotEmpty, IsNumber } from 'class-validator';
import { OrderCreatedPayload } from '@app/common/contracts/delivery';

export class NotifyOrderDto implements OrderCreatedPayload {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
