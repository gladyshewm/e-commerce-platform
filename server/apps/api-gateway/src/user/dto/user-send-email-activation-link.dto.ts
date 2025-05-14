import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SendEmailActivationPayload } from '@app/common/contracts/user';

export class SendEmailActivationLinkDto implements SendEmailActivationPayload {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: '6Mv4o@example.com' })
  email: string;
}
