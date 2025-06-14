export enum ProductCommands {
  GetAll = 'product.get-all',
  GetById = 'product.get-by-id',
  Create = 'product.create',
  Update = 'product.update',
  Delete = 'product.delete',

  GetCategories = 'product.get-categories',
  CreateCategory = 'product.create-category',
  UpdateCategory = 'product.update-category',
  DeleteCategory = 'product.delete-category',

  GetReviewsByProductId = 'product.get-reviews-by-product-id',
  CreateReview = 'product.create-review',
  DeleteReview = 'product.delete-review',
}
