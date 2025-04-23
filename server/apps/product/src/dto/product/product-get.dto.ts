import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { GetProductsQueryPayload } from '@app/common/contracts/product';
import { Transform, Type } from 'class-transformer';

export class GetProductsQueryDto implements GetProductsQueryPayload {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsString()
  sort?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map(Number) : value,
  )
  @IsArray()
  @IsNumber({}, { each: true })
  productIds?: number[];
}
