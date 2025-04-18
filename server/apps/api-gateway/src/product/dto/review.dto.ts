import { Review } from '@app/common/contracts/product';
import { ApiProperty } from '@nestjs/swagger';
import { GetUserResponseDto } from '../../user/dto/user-get-response.dto';

export class ReviewDto implements Review {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: 'Great product!' })
  comment: string;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: () => GetUserResponseDto })
  user: GetUserResponseDto;
}
