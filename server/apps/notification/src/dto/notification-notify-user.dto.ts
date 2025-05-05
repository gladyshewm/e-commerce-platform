import { OrderCreatedPayload } from '@app/common/contracts/notification';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class NotifyUserDto implements OrderCreatedPayload {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
