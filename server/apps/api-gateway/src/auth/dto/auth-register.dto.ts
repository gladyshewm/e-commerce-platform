import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { RegisterPayload } from '@app/common/contracts/auth';

export class RegisterDto implements RegisterPayload {
  @ApiProperty({ example: 'john' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'changeme' })
  @IsString()
  @MinLength(6)
  password: string;
}
