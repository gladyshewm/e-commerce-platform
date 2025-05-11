import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@app/common/database/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
