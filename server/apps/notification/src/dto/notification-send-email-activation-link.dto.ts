import { SendEmailActivationLinkPayload } from '@app/common/contracts/notification';
import { IsNotEmpty, IsString } from 'class-validator';
import { NotifyUserDto } from './notification-notify-user.dto';

export class SendEmailActivationLinkDto
  extends NotifyUserDto
  implements SendEmailActivationLinkPayload
{
  @IsString()
  @IsNotEmpty()
  token: string;
}
