import { UserWithoutPassword } from '@app/common/contracts/user';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserResponseDto implements UserWithoutPassword {
  @ApiProperty({ example: '1' })
  userId: number;

  @ApiProperty({ example: 'john' })
  username: string;
}
