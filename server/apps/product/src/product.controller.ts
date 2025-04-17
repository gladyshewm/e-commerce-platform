import { Controller } from '@nestjs/common';
import { ProductService } from './product.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import {
  Category,
  CreateCategoryPayload,
  CreateProductPayload,
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
