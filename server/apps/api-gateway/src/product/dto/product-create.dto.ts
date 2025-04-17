import { CreateProductPayload } from '@app/common/contracts/product';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Product 1' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Description 1' })
  description?: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ example: 1599 })
  price: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'sku-1' })
  sku: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 1 })
  categoryId?: number;
}
