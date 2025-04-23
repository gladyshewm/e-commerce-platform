import { LogoutPayload } from '@app/common/contracts/auth';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto implements LogoutPayload {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
