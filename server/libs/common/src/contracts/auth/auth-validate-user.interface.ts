import { User } from '../user';

export interface ValidateUserPayload
  extends Pick<User, 'username' | 'password'> {}
