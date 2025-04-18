import { UserWithoutPassword } from '../user';

export interface Review {
  id: number;
  rating: number;
  comment: string;
  user: UserWithoutPassword;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}
