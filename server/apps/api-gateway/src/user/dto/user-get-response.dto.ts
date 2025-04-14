import { UserWithoutPassword } from '@app/common/contracts/user';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@app/common/entities';

export class GetUserResponseDto implements UserWithoutPassword {
  @ApiProperty({ example: '1' })
  id: number;

  @ApiProperty({ example: 'john' })
  username: string;

  @ApiProperty({ example: '6Mv4o@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
