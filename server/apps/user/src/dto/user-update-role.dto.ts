import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { UserRole } from '@app/common/database/enums';
import { UpdateUserRolePayload } from '@app/common/contracts/user';

export class UpdateUserRoleDto implements UpdateUserRolePayload {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
