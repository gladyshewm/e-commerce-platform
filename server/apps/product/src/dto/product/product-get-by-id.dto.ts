import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetProductByIdDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
