import { UserWithoutPassword } from '../user';

export interface LoginPayload extends UserWithoutPassword {
  ipAddress?: string;
  userAgent?: string;
}
