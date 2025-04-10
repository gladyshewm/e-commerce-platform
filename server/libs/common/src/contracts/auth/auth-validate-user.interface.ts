import { User } from '../user';

export interface ValidateUserPayload extends Omit<User, 'userId'> {}
