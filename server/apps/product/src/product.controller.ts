import { Controller } from '@nestjs/common';
import { ProductService } from './product.service';
import { Ctx, MessagePattern, RmqContext } from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';

@Controller()
export class ProductController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly productService: ProductService,
  ) {
    super(rmqService);
  }

  @MessagePattern('get_products')
  getProducts(@Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.productService.getProducts());
  }
}
