import { User } from './user.interface';

export interface CreateUserPayload extends Omit<User, 'userId'> {}
