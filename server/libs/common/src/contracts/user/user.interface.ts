export interface User {
  userId: number;
  username: string;
  password: string;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}
