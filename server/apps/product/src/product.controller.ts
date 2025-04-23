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
import { GetProductsQueryDto } from './dto/product/product-get.dto';
import { GetProductByIdDto } from './dto/product/product-get-by-id.dto';
import { CreateProductDto } from './dto/product/product-create.dto';
import { InventoryCreateFailedDto } from './dto/product/inventory-create-failed.dto';
import { UpdateProductDto } from './dto/product/product-update.dto';
import { DeleteProductDto } from './dto/product/product-delete.dto';
import { GetReviewsByProductId } from './dto/review/review-get.dto';
import { CreateReviewDto } from './dto/review/review-create.dto';
import { DeleteReviewDto } from './dto/review/review-delete.dto';
import { CreateCategoryDto } from './dto/category/category-create.dto';
import { UpdateCategoryDto } from './dto/category/category-update.dto';
import { DeleteCategoryDto } from './dto/category/category-delete.dto';
import { InventoryCreatedDto } from './dto/product/inventory-created.dto';

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
    @Payload() payload: GetProductsQueryDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.getProducts(payload),
    );
  }

  @MessagePattern('get_product_by_id')
  async getProductById(
    @Payload() payload: GetProductByIdDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.getProductById(payload.id),
    );
  }

  @MessagePattern('create_product')
  async createProduct(
    @Payload() payload: CreateProductDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.createProduct(payload),
    );
  }

  @EventPattern('inventory_created')
  async inventoryCreatedHandler(
    @Payload() payload: InventoryCreatedDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.productService.updateInventoryForProduct(payload),
    );
  }

  @EventPattern('inventory_create_failed')
  async inventoryCreateFailedHandler(
    @Payload() payload: InventoryCreateFailedDto,
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
    @Payload() payload: UpdateProductDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.updateProduct(payload),
    );
  }

  @MessagePattern('delete_product')
  async deleteProduct(
    @Payload() payload: DeleteProductDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.deleteProduct(payload.id),
    );
  }

  // REVIEWS

  @MessagePattern('get_reviews')
  async getReviews(
    @Payload() payload: GetReviewsByProductId,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.getReviews(payload.productId),
    );
  }

  @MessagePattern('create_review')
  async createReview(
    @Payload() payload: CreateReviewDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.createReview(payload),
    );
  }

  @MessagePattern('delete_review')
  async deleteReview(
    @Payload() payload: DeleteReviewDto,
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
    @Payload() payload: CreateCategoryDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.createCategory(payload),
    );
  }

  @MessagePattern('update_category')
  async updateCategory(
    @Payload() payload: UpdateCategoryDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.updateCategory(payload),
    );
  }

  @MessagePattern('delete_category')
  async deleteCategory(
    @Payload() payload: DeleteCategoryDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.deleteCategory(payload.id),
    );
  }
}
