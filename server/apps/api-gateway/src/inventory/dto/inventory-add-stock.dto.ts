import { AddStockPayload } from '@app/common/contracts/inventory';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class AddStockDto implements Omit<AddStockPayload, 'productId'> {
  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 5 })
  quantity: number;
}
