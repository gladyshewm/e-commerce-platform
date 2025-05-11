import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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
import { handleRpcError } from '../common/utils/rpc-exception.util';
import { JwtAuthGuard, Roles, RolesGuard } from '@app/common/auth';
import {
  Category,
  ProductWithCategory,
  Review,
} from '@app/common/contracts/product';
import { ProductWithCategoryDto } from './dto/product.dto';
import { CreateCategoryDto } from './dto/category-create.dto';
import { CategoryDto } from './dto/category.dto';
import { CreateProductDto } from './dto/product-create.dto';
import { UpdateProductDto } from './dto/product-update.dto';
import { GetProductsQueryDto } from './dto/product-get.dto';
import { ReviewDto } from './dto/review.dto';
import { CreateReviewDto } from './dto/review-create.dto';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '@app/common/contracts/user';
import { UserRole } from '@app/common/database/enums';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productServiceClient: ClientProxy,
  ) {}

  // CATEGORIES

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    type: [CategoryDto],
    description: 'Returns an array of categories',
  })
  async getCategories(): Promise<CategoryDto[]> {
    return lastValueFrom<Category[]>(
      this.productServiceClient
        .send('get_categories', {})
        .pipe(handleRpcError()),
    );
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    type: CategoryDto,
    description: 'Returns the created category',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for your role',
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({
    status: 200,
    type: CategoryDto,
    description: 'Returns the updated category',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for your role',
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: 200,
    type: CategoryDto,
    description: 'Returns the deleted category',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for your role',
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

  // PRODUCTS

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    type: [ProductWithCategoryDto],
    description: 'Returns an array of products',
  })
  async getProducts(
    @Query() query: GetProductsQueryDto,
  ): Promise<ProductWithCategoryDto[]> {
    return lastValueFrom<ProductWithCategory[]>(
      this.productServiceClient
        .send('get_products', query)
        .pipe(handleRpcError()),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({
    status: 200,
    type: ProductWithCategoryDto,
    description: 'Returns a product',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(
    @Param('id') id: number,
  ): Promise<ProductWithCategoryDto> {
    return lastValueFrom<ProductWithCategory>(
      this.productServiceClient
        .send('get_product_by_id', { id })
        .pipe(handleRpcError()),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    type: ProductWithCategoryDto,
    description: 'Returns the created product',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for your role',
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    type: ProductWithCategoryDto,
    description: 'Returns the updated product',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for your role',
  })
  @ApiResponse({
    status: 404,
    description: 'Product with this id not found',
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    type: ProductWithCategoryDto,
    description: 'Returns the deleted product',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for your role',
  })
  @ApiResponse({
    status: 404,
    description: 'Product with this id not found',
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

  // REVIEWS

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get all reviews for a product' })
  @ApiResponse({
    status: 200,
    type: [ReviewDto],
    description: 'Returns an array of reviews',
  })
  async getReviews(@Param('id') id: number): Promise<ReviewDto[]> {
    return lastValueFrom<Review[]>(
      this.productServiceClient
        .send('get_reviews', { productId: id })
        .pipe(handleRpcError()),
    );
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new review for a product' })
  @ApiResponse({
    status: 201,
    type: ReviewDto,
    description: 'Returns the created review',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiBearerAuth()
  async createReview(
    @Param('id') id: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: Pick<User, 'id' | 'username'>,
  ): Promise<ReviewDto> {
    return lastValueFrom<Review>(
      this.productServiceClient
        .send('create_review', { productId: id, userId: user.id, ...dto })
        .pipe(handleRpcError()),
    );
  }

  @Delete(':productId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({
    status: 200,
    type: ReviewDto,
    description: 'Returns the deleted review',
  })
  @ApiResponse({
    status: 404,
    description:
      "You don't have access to delete this review or review not found",
  })
  @ApiBearerAuth()
  async deleteReview(
    @Param('productId') productId: number,
    @Param('reviewId') reviewId: number,
    @CurrentUser() user: Pick<User, 'id' | 'username'>,
  ): Promise<ReviewDto> {
    return lastValueFrom<Review>(
      this.productServiceClient
        .send('delete_review', { productId, reviewId, userId: user.id })
        .pipe(handleRpcError()),
    );
  }
}
