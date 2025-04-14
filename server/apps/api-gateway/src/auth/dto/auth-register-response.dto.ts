import { RegisterResponse } from '@app/common/contracts/auth';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto
  implements Omit<RegisterResponse, 'refreshToken'>
{
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      username: { type: 'string', example: 'john_doe' },
      email: { type: 'string', example: '6Mv4o@example.com' },
      role: { type: 'string', example: 'customer' },
      isEmailVerified: { type: 'boolean', example: true },
      createdAt: { type: 'string', example: '2021-01-01T00:00:00.000Z' },
      updatedAt: { type: 'string', example: '2021-01-01T00:00:00.000Z' },
    },
  })
  user: UserWithoutPassword;

  @ApiProperty({ example: 'token' })
  accessToken: string;
}
