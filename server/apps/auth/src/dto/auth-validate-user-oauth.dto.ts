import { ValidateUserOAuthPayload } from '@app/common/contracts/auth';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ValidateUserOauthDto implements ValidateUserOAuthPayload {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  providerId: string;
}
