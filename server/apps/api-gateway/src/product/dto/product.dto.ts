import { Product } from '@app/common/contracts/product';
import { ApiProperty } from '@nestjs/swagger';

export class ProductDto implements Product {
  @ApiProperty({ example: '1' })
  id: number;

  @ApiProperty({ example: 'Product 1' })
  name: string;

  @ApiProperty({ example: 'Description 1' })
  description: string;

  @ApiProperty({ example: 10 })
  price: number;

  @ApiProperty({ example: 'sku-1' })
  sku: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
