import { IsNotEmpty, IsNumber } from 'class-validator';

export class OrderShippedDto {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
