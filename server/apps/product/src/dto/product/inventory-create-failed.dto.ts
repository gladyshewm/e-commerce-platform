import { IsNotEmpty, IsNumber } from 'class-validator';
import { InventoryCreateFailedPayload } from '@app/common/contracts/product';

export class InventoryCreateFailedDto implements InventoryCreateFailedPayload {
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
