import { IsNotEmpty, IsString } from 'class-validator';
import { ActivateUserEmailPayload } from '@app/common/contracts/user';

export class ActivateUserEmailDto implements ActivateUserEmailPayload {
  @IsString()
  @IsNotEmpty()
  token: string;
}
