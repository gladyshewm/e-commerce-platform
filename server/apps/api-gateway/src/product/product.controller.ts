import { Controller, Get, Inject, Logger, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PRODUCT_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { handleRpcError } from '../common/utils/rpc-exception.utils';
import { JwtAuthGuard } from '@app/common/auth';
import { Product } from '@app/common/contracts/product';
import { ProductDto } from './dto/product.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productServiceClient: ClientProxy,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    type: [ProductDto],
    description: 'Returns an array of products',
  })
  @ApiBearerAuth()
  async getProducts(): Promise<ProductDto[]> {
    return lastValueFrom<Product[]>(
      this.productServiceClient.send('get_products', {}).pipe(handleRpcError()),
    );
  }
}
