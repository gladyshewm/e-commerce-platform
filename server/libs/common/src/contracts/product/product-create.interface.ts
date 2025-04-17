import { Product } from './product.interface';

export interface CreateProductPayload
  extends Pick<Product, 'name' | 'description' | 'price' | 'sku'> {
  categoryId?: number;
}
