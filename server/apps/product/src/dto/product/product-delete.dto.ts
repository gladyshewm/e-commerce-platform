import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteProductDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
