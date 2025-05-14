import { IsNotEmpty, IsString } from 'class-validator';
import { ActivateUserEmailPayload } from '@app/common/contracts/user';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateUserEmailQueryDto implements ActivateUserEmailPayload {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'email-verification-token' })
  token: string;
}
