import { CreateReviewPayload } from '@app/common/contracts/product';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateReviewDto
  implements Pick<CreateReviewPayload, 'rating' | 'comment'>
{
  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 5 })
  rating: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Great product!' })
  comment: string;
}
