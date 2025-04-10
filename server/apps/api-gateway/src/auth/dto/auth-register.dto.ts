import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { CreateUserPayload } from '@app/common/contracts/user';

export class RegisterDto implements CreateUserPayload {
  @ApiProperty({ example: 'john' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'changeme' })
  @IsString()
  @MinLength(6)
  password: string;
}
