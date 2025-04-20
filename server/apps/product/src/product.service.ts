import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  Category,
  CreateCategoryPayload,
  CreateProductPayload,
  CreateReviewPayload,
  DeleteReviewPayload,
  GetProductsQueryPayload,
  ProductWithCategory,
  Review,
} from '@app/common/contracts/product';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CategoryEntity,
  ProductEntity,
  ReviewEntity,
} from '@app/common/database/entities';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { INVENTORY_SERVICE, USER_SERVICE } from '@app/common/constants';
import { catchError, lastValueFrom } from 'rxjs';
import { UserWithoutPassword } from '@app/common/contracts/user';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryServiceClient: ClientProxy,
  ) {}

  async getProducts(
    payload: GetProductsQueryPayload,
  ): Promise<ProductWithCategory[]> {
    const { search, sort, categoryId, productIds } = payload; // TODO: limit, offset
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      query.andWhere(
        'product.name ILIKE :search OR product.description ILIKE :search',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (sort === 'asc' || sort === 'desc') {
      query.orderBy('product.createdAt', sort.toUpperCase() as 'ASC' | 'DESC');
    } else {
      query.orderBy('product.createdAt', 'DESC');
    }

    if (productIds && productIds.length) {
      query.andWhere('product.id IN (:...productIds)', { productIds });
    }

    const products = await query.getMany();
    return products;
  }

  async getProductById(id: number): Promise<ProductWithCategory> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      this.logger.error(`Product with id ${id} not found`);
      throw new RpcException({
        message: `Product with id ${id} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return product;
  }

  async createProduct(
    payload: CreateProductPayload,
  ): Promise<ProductWithCategory> {
    const existingProduct = await this.productRepository.findOneBy({
      name: payload.name,
    });

    if (existingProduct) {
      this.logger.error(`Product with name ${payload.name} already exists`);
      throw new RpcException({
        message: `Product with name ${payload.name} already exists`,
        statusCode: HttpStatus.CONFLICT,
      });
    }

    const product = this.productRepository.create({
      name: payload.name,
      description: payload.description,
      price: payload.price,
      sku: payload.sku,
      category: payload.categoryId && { id: payload.categoryId },
    });

    const saved = await this.productRepository.save(product);

    this.inventoryServiceClient
      .emit('product_created', {
        productId: saved.id,
      })
      .subscribe();

    if (!payload.categoryId) return saved;

    const category = await this.categoryRepository.findOneBy({
      id: saved.category.id,
    });

    return { ...saved, category };
  }

  async updateProduct(payload: Partial<CreateProductPayload> & { id: number }) {
    const product = await this.productRepository.findOne({
      where: { id: payload.id },
      relations: ['category'],
    });

    if (!product) {
      this.logger.error(`Product with id ${payload.id} not found`);
      throw new RpcException({
        message: `Product with id ${payload.id} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const updatableFields: Partial<CreateProductPayload> = {
      name: payload.name,
      description: payload.description,
      price: payload.price,
      sku: payload.sku,
    };

    Object.entries(updatableFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        product[key] = value;
      }
    });

    if (payload.categoryId) {
      // FIXME: вынести в общий метод getCategory
      const category = await this.categoryRepository.findOneBy({
        id: payload.categoryId,
      });

      if (!category) {
        this.logger.error(`Category with id ${payload.categoryId} not found`);
        throw new RpcException({
          message: `Category with id ${payload.categoryId} not found`,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      product.category = category;
    }

    return this.productRepository.save(product);
  }

  async deleteProduct(id: number): Promise<ProductWithCategory> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      this.logger.error(`Product with id ${id} not found`);
      throw new RpcException({
        message: `Product with id ${id} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return this.productRepository.remove(product);
  }

  // REVIEWS

  async getReviews(id: number): Promise<Review[]> {
    const reviews = await this.reviewRepository.find({
      where: { product: { id } },
      relations: ['user', 'product'],
    });

    if (!reviews.length) {
      this.logger.warn(`Reviews for product with id ${id} not found`);
    }

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      productId: r.product.id,
      user: r.user,
    }));
  }

  async createReview(payload: CreateReviewPayload): Promise<Review> {
    const product = await this.productRepository.findOneBy({
      id: payload.productId,
    });

    if (!product) {
      this.logger.error(`Product with id ${payload.productId} not found`);
      throw new RpcException({
        message: `Product with id ${payload.productId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const user = await lastValueFrom(
      this.userServiceClient
        .send<UserWithoutPassword>('get_user_by_id', {
          id: payload.userId,
        })
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              statusCode: error.statusCode,
            });
          }),
        ),
    );

    const review = this.reviewRepository.create({
      rating: payload.rating,
      comment: payload.comment,
      user: user,
      product: { id: payload.productId },
    });
    const saved = await this.reviewRepository.save(review);

    return {
      id: saved.id,
      rating: saved.rating,
      comment: saved.comment,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      productId: saved.product.id,
      user: saved.user,
    };
  }

  async deleteReview(payload: DeleteReviewPayload): Promise<Review> {
    const { productId, reviewId, userId } = payload;

    const review = await this.reviewRepository.findOne({
      where: {
        id: reviewId,
        product: { id: productId },
        user: { id: userId }, // пользователь может удалить только свой отзыв
      },
      relations: ['user', 'product'],
    });

    if (!review) {
      this.logger.error(`Review with id ${reviewId} not found`);
      throw new RpcException({
        message: `Review with id ${reviewId} not found or you don't have access`,
        statusCode: HttpStatus.NOT_FOUND, // FORBIDDEN
      });
    }

    const removed = await this.reviewRepository.remove(review);
    return {
      id: removed.id,
      rating: removed.rating,
      comment: removed.comment,
      createdAt: removed.createdAt,
      updatedAt: removed.updatedAt,
      productId: removed.product.id,
      user: removed.user,
    };
  }

  // CATEGORIES

  async getCategories(): Promise<Category[]> {
    const categories = await this.categoryRepository.find();
    return categories;
  }

  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    const existingCategory = await this.categoryRepository.findOneBy({
      name: payload.name,
    });

    if (existingCategory) {
      this.logger.error(`Category with name ${payload.name} already exists`);
      throw new RpcException({
        message: `Category with name ${payload.name} already exists`,
        statusCode: HttpStatus.CONFLICT,
      });
    }

    const category = this.categoryRepository.create(payload);
    return this.categoryRepository.save(category);
  }

  async updateCategory(payload: Category): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({
      id: payload.id,
    });

    if (!category) {
      this.logger.error(`Category with id ${payload.id} not found`);
      throw new RpcException({
        message: `Category with id ${payload.id} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    category.name = payload.name;
    if (payload.description) category.description = payload.description;

    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category) {
      this.logger.error(`Category with id ${id} not found`);
      throw new RpcException({
        message: `Category with id ${id} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return this.categoryRepository.remove(category);
  }
}
