import { User } from './user.interface';

export interface UserOAuth {
  id: number;
  provider: string;
  providerId: string;
  userId: number;
}

export interface UserWithOAuth extends Omit<User, 'password'> {
  oauthAccounts: Omit<UserOAuth, 'userId'>[];
}
