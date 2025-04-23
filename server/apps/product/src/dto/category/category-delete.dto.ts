import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteCategoryDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
