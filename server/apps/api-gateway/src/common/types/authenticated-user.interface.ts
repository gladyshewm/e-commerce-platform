import { UserRole } from '@app/common/database/enums';

export interface AuthenticatedUser {
  id: number;
  username: string;
  role: UserRole;
}
