import { OrderCreatedPayload } from '@app/common/contracts/delivery';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ScheduleDeliveryDto implements OrderCreatedPayload {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
