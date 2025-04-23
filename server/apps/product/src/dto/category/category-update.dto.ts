import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateCategoryDto } from './category-create.dto';

export class UpdateCategoryDto extends CreateCategoryDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
