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
import { InventoryEvents, ProductCommands } from '@app/common/messaging';
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

  @MessagePattern(ProductCommands.GetAll)
  async getProducts(
    @Payload() payload: GetProductsQueryDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.getProducts(payload),
    );
  }

  @MessagePattern(ProductCommands.GetById)
  async getProductById(
    @Payload() payload: GetProductByIdDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.getProductById(payload.id),
    );
  }

  @MessagePattern(ProductCommands.Create)
  async createProduct(
    @Payload() payload: CreateProductDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.createProduct(payload),
    );
  }

  @EventPattern(InventoryEvents.Created)
  async inventoryCreatedHandler(
    @Payload() payload: InventoryCreatedDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.productService.updateInventoryForProduct(payload),
    );
  }

  @EventPattern(InventoryEvents.CreationFailed)
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

  @MessagePattern(ProductCommands.Update)
  async updateProduct(
    @Payload() payload: UpdateProductDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.updateProduct(payload),
    );
  }

  @MessagePattern(ProductCommands.Delete)
  async deleteProduct(
    @Payload() payload: DeleteProductDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.deleteProduct(payload.id),
    );
  }

  // REVIEWS

  @MessagePattern(ProductCommands.GetReviewsByProductId)
  async getReviews(
    @Payload() payload: GetReviewsByProductId,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.getReviews(payload.productId),
    );
  }

  @MessagePattern(ProductCommands.CreateReview)
  async createReview(
    @Payload() payload: CreateReviewDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.createReview(payload),
    );
  }

  @MessagePattern(ProductCommands.DeleteReview)
  async deleteReview(
    @Payload() payload: DeleteReviewDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.deleteReview(payload),
    );
  }

  // CATEGORIES

  @MessagePattern(ProductCommands.GetCategories)
  async getCategories(@Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.productService.getCategories());
  }

  @MessagePattern(ProductCommands.CreateCategory)
  async createCategory(
    @Payload() payload: CreateCategoryDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.createCategory(payload),
    );
  }

  @MessagePattern(ProductCommands.UpdateCategory)
  async updateCategory(
    @Payload() payload: UpdateCategoryDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.updateCategory(payload),
    );
  }

  @MessagePattern(ProductCommands.DeleteCategory)
  async deleteCategory(
    @Payload() payload: DeleteCategoryDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.productService.deleteCategory(payload.id),
    );
  }
}
