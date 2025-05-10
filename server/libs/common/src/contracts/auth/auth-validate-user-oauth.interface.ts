import { User } from '../user';

export interface ValidateUserOAuthPayload
  extends Pick<User, 'username' | 'email'> {
  provider: string;
  providerId: string;
}
