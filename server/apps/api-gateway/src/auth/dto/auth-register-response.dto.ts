import { RegisterResponse } from '@app/common/contracts/auth';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto
  implements Omit<RegisterResponse, 'refreshToken'>
{
  @ApiProperty({
    type: 'object',
    properties: {
      userId: { type: 'number', example: 1 },
      username: { type: 'string', example: 'john_doe' },
    },
  })
  user: UserWithoutPassword;

  @ApiProperty({ example: 'token' })
  accessToken: string;
}
