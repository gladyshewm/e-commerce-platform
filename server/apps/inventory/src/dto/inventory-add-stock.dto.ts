import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { AddStockPayload } from '@app/common/contracts/inventory';

export class AddStockDto implements AddStockPayload {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}
