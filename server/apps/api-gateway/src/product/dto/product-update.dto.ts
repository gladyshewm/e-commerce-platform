import { CreateProductDto } from './product-create.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
