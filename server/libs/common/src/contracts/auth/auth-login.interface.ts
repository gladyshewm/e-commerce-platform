import { User } from '../user';

export interface LoginPayload extends Pick<User, 'id' | 'username'> {
  ipAddress?: string;
  userAgent?: string;
}
