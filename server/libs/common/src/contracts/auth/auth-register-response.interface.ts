import { UserWithoutPassword } from '../user';

export interface RegisterResponse {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
}
