import { User } from './user.interface';

export interface CreateUserPayload
  extends Pick<User, 'username' | 'email' | 'password'> {}
