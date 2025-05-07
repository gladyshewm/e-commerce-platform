import { User } from '../user';

export interface LoginPayload extends Pick<User, 'id' | 'username' | 'role'> {
  ipAddress?: string;
  userAgent?: string;
}
