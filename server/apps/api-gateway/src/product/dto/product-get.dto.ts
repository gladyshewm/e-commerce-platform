import { GetProductsQueryPayload } from '@app/common/contracts/product';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  @Transform(({ value }) => 
    typeof value === 'string' 
      ? value.split(',').map(Number) 
      : value
  )
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiProperty({ example: '1,2,3', required: false })
  productIds?: number[];
}
