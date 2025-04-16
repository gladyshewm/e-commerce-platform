import { UserRole } from '../../database/enums';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}
