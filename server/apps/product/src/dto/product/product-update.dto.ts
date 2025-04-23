import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './product-create.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
