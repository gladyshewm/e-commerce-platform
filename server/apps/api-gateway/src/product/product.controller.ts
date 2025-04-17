import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { Category, ProductWithCategory } from '@app/common/contracts/product';
import { ProductWithCategoryDto } from './dto/product.dto';
import { CreateCategoryDto } from './dto/category-create.dto';
import { CategoryDto } from './dto/category.dto';
import { CreateProductDto } from './dto/product-create.dto';
import { UpdateProductDto } from './dto/product-update.dto';
import { GetProductsQueryDto } from './dto/product-get.dto';

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
    type: [ProductWithCategoryDto],
    description: 'Returns an array of products',
  })
  @ApiBearerAuth()
  async getProducts(
    @Query() query: GetProductsQueryDto,
  ): Promise<ProductWithCategoryDto[]> {
    return lastValueFrom<ProductWithCategory[]>(
      this.productServiceClient
        .send('get_products', query)
        .pipe(handleRpcError()),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    type: ProductWithCategoryDto,
    description: 'Returns the created product',
  })
  @ApiResponse({
    status: 409,
    description: 'Product with the same name already exists',
  })
  @ApiBearerAuth()
  async createProduct(
    @Body() dto: CreateProductDto,
  ): Promise<ProductWithCategoryDto> {
    return lastValueFrom<ProductWithCategory>(
      this.productServiceClient
        .send('create_product', dto)
        .pipe(handleRpcError()),
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    type: ProductWithCategoryDto,
    description: 'Returns the updated product',
  })
  @ApiBearerAuth()
  async updateProduct(
    @Param('id') id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductWithCategoryDto> {
    return lastValueFrom<ProductWithCategory>(
      this.productServiceClient
        .send('update_product', { id, ...dto })
        .pipe(handleRpcError()),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    type: ProductWithCategoryDto,
    description: 'Returns the deleted product',
  })
  @ApiBearerAuth()
  async deleteProduct(
    @Param('id') id: number,
  ): Promise<ProductWithCategoryDto> {
    return lastValueFrom<ProductWithCategory>(
      this.productServiceClient
        .send('delete_product', { id })
        .pipe(handleRpcError()),
    );
  }

  // CATEGORIES

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    type: [CategoryDto],
    description: 'Returns an array of categories',
  })
  @ApiBearerAuth()
  async getCategories(): Promise<CategoryDto[]> {
    return lastValueFrom<Category[]>(
      this.productServiceClient
        .send('get_categories', {})
        .pipe(handleRpcError()),
    );
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    type: CategoryDto,
    description: 'Returns the created category',
  })
  @ApiResponse({
    status: 409,
    description: 'Category with the same name already exists',
  })
  @ApiBearerAuth()
  async createCategory(@Body() dto: CreateCategoryDto): Promise<CategoryDto> {
    return lastValueFrom<Category>(
      this.productServiceClient
        .send('create_category', dto)
        .pipe(handleRpcError()),
    );
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({
    status: 200,
    type: CategoryDto,
    description: 'Returns the updated category',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiBearerAuth()
  async updateCategory(
    @Param('id') id: number,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    return lastValueFrom<Category>(
      this.productServiceClient
        .send('update_category', { id, ...dto })
        .pipe(handleRpcError()),
    );
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: 200,
    type: CategoryDto,
    description: 'Returns the deleted category',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiBearerAuth()
  async deleteCategory(@Param('id') id: number): Promise<CategoryDto> {
    return lastValueFrom<Category>(
      this.productServiceClient
        .send('delete_category', { id })
        .pipe(handleRpcError()),
    );
  }
}
