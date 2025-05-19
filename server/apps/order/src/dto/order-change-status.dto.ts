import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { OrderStatus } from '@app/common/database/enums';

export class ChangeOrderStatusDto {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
