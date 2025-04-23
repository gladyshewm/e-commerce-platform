import { DeleteReviewPayload } from '@app/common/contracts/product';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteReviewDto implements DeleteReviewPayload {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  reviewId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
