export interface GetProductsQueryPayload {
  search?: string;
  categoryId?: number;
  sort?: 'asc' | 'desc';
}
