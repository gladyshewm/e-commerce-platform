import { Category } from './category.interface';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  sku: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithCategory extends Product {
  category: Category;
}
