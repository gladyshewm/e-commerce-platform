import { LinkUserWithOAuthPayload } from '@app/common/contracts/user';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LinkUserWithOAuthDto implements LinkUserWithOAuthPayload {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  providerId: string;
}
