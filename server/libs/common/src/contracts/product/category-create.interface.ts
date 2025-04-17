import { Category } from './category.interface';

export interface CreateCategoryPayload extends Omit<Category, 'id'> {}
