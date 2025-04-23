import { IsNotEmpty, IsNumber } from 'class-validator';
import { InventoryCreatedPayload } from '@app/common/contracts/product';

export class InventoryCreatedDto implements InventoryCreatedPayload {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  inventoryId: number;
}
