import { LoginResponse } from '@app/common/contracts/auth';
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto implements Omit<LoginResponse, 'refreshToken'> {
  @ApiProperty({ example: 'token' })
  accessToken: string;
}
