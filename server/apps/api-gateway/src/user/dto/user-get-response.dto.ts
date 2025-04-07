import { User } from '@app/common/contracts';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserResponseDto implements User {
  @ApiProperty({ example: '1' })
  userId: number;

  @ApiProperty({ example: 'john' })
  username: string;
}
