import { CreateUserOAuthPayload } from '@app/common/contracts/user';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserOAuthDto implements CreateUserOAuthPayload {
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
