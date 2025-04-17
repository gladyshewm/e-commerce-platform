import { GetProductsQueryPayload } from '@app/common/contracts/product';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetProductsQueryDto implements GetProductsQueryPayload {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Product', required: false })
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 1, required: false })
  categoryId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ enum: ['asc', 'desc'], required: false })
  sort?: 'asc' | 'desc';
}
