import { Category } from '@app/common/contracts/product';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto implements Category {
  @ApiProperty({ example: '1' })
  id: number;

  @ApiProperty({ example: 'Category_name 1' })
  name: string;

  @ApiProperty({ example: 'Description 1' })
  description?: string;
}
