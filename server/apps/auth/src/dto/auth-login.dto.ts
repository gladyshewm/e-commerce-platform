import {
  IsEnum,
  IsIP,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LoginPayload } from '@app/common/contracts/auth';
import { UserRole } from '@app/common/database/enums';

export class LoginDto implements LoginPayload {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
