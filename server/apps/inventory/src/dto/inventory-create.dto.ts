import { IsNotEmpty, IsNumber } from 'class-validator';
import { ProductCreatedPayload } from '@app/common/contracts/inventory';

export class CreateInventoryDto implements ProductCreatedPayload {
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
