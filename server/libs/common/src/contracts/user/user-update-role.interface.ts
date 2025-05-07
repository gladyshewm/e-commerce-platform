import { UserRole } from '../../database/enums';

export interface UpdateUserRolePayload {
  userId: number;
  role: UserRole;
}
