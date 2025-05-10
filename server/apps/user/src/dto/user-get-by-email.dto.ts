import { GetUserByEmailPayload } from '@app/common/contracts/user';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class GetUserByEmailDto implements GetUserByEmailPayload {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
