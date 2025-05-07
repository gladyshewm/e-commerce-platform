import { IsEnum } from 'class-validator';
import { UserRole } from '@app/common/database/enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  @ApiProperty({ enum: UserRole, example: UserRole.MANAGER })
  role: UserRole;
}
