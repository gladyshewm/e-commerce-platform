import { LoginResponse } from '@app/common/contracts';
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto implements LoginResponse {
  @ApiProperty({ example: 'token' })
  access_token: string;
}
