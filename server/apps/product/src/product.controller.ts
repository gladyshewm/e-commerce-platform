import { Controller } from '@nestjs/common';
import { ProductService } from './product.service';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import {
  Category,
  CreateCategoryPayload,
  CreateProductPayload,
  CreateReviewPayload,
  DeleteReviewPayload,
  GetProductsQueryPayload,
} from '@app/common/contracts/product';

@Controller()
export class ProductController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly productService: ProductService,
  ) {
    super(rmqService);
  }

  @MessagePattern('get_products')
  async getProducts(
    @Payload() payload: GetProductsQueryPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.getProducts(payload),
    );
  }

  @MessagePattern('create_product')
  async createProduct(
    @Payload() payload: CreateProductPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.createProduct(payload),
    );
  }

  @EventPattern('inventory_create_failed')
  async inventoryCreateFailedHandler(
    @Payload() payload: { productId: number },
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.productService.deleteProduct(payload.productId),
    );
    this.logger.warn(
      `Cancelled product creation: ${payload.productId} due to inventory creation failure`,
    );
  }

  @MessagePattern('update_product')
  async updateProduct(
    @Payload() payload: Partial<CreateProductPayload> & { id: number },
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.updateProduct(payload),
    );
  }

  @MessagePattern('delete_product')
  async deleteProduct(@Payload('id') id: number, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.productService.deleteProduct(id));
  }

  // REVIEWS

  @MessagePattern('get_reviews')
  async getReviews(@Payload('id') id: number, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.productService.getReviews(id));
  }

  @MessagePattern('create_review')
  async createReview(
    @Payload() payload: CreateReviewPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.createReview(payload),
    );
  }

  @MessagePattern('delete_review')
  async deleteReview(
    @Payload() payload: DeleteReviewPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.deleteReview(payload),
    );
  }

  // CATEGORIES

  @MessagePattern('get_categories')
  async getCategories(@Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.productService.getCategories());
  }

  @MessagePattern('create_category')
  async createCategory(
    @Payload() payload: CreateCategoryPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.createCategory(payload),
    );
  }

  @MessagePattern('update_category')
  async updateCategory(@Payload() payload: Category, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.productService.updateCategory(payload),
    );
  }

  @MessagePattern('delete_category')
  async deleteCategory(@Payload('id') id: number, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.productService.deleteCategory(id),
    );
  }
}
