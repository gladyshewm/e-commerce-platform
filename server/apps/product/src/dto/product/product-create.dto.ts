import { CreateProductPayload } from '@app/common/contracts/product';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateProductDto implements CreateProductPayload {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;
}
