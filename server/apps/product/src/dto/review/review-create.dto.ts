import { CreateReviewPayload } from '@app/common/contracts/product';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateReviewDto implements CreateReviewPayload {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
