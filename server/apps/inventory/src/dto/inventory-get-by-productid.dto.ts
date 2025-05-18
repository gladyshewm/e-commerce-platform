import { IsNotEmpty, IsNumber } from 'class-validator';
import { GetInventoryByProductIdPayload } from '@app/common/contracts/inventory';

export class GetInventoryByProductIdDto
  implements GetInventoryByProductIdPayload
{
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
