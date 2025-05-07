import { UserRole } from '@app/common/database/enums';

export interface JwtPayload {
  userId: number;
  username: string;
  userRole: UserRole;
  iat: number;
  exp: number;
}
