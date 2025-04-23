import { IsNotEmpty, IsNumber } from 'class-validator';

export class InventoryCreateFailedDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
