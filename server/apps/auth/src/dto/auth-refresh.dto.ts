import { RefreshPayload } from '@app/common/contracts/auth';
import { IsIP, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshDto implements RefreshPayload {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
