import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetReviewsByProductId {
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
