import { Inventory } from '@app/common/contracts/inventory';
import { ApiProperty } from '@nestjs/swagger';

export class InventoryDto implements Inventory {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  availableQuantity: number;

  @ApiProperty({ example: 5 })
  reservedQuantity: number;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 1 })
  productId: number;
}
