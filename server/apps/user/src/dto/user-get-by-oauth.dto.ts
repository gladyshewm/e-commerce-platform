import { GetUserByOAuthPayload } from '@app/common/contracts/user';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetUserByOAuthDto implements GetUserByOAuthPayload {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  providerId: string;
}
