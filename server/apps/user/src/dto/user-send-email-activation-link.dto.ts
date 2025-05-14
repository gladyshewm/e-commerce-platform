import { IsEmail, IsNotEmpty } from 'class-validator';
import { SendEmailActivationPayload } from '@app/common/contracts/user';

export class SendEmailActivationLinkDto implements SendEmailActivationPayload {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
