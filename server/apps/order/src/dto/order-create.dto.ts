import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { CreateOrderPayload } from '@app/common/contracts/order';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class CreateOrderDto implements CreateOrderPayload {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsArray()
  @ValidateNested()
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
