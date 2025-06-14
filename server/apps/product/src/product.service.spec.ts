import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  CategoryEntity,
  ProductEntity,
  ReviewEntity,
} from '@app/common/database/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { INVENTORY_SERVICE, USER_SERVICE } from '@app/common/constants';
import {
  Category,
  CreateProductPayload,
  CreateReviewPayload,
  DeleteReviewPayload,
  GetProductsQueryPayload,
  InventoryCreatedPayload,
  ProductWithCategory,
  Review,
} from '@app/common/contracts/product';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';
import { ProductEvents, UserCommands } from '@app/common/messaging';
import { CreateCategoryDto } from './dto/category/category-create.dto';
import { UpdateCategoryDto } from './dto/category/category-update.dto';

describe('ProductService', () => {
  let productService: ProductService;
  let productRepository: jest.Mocked<Repository<ProductEntity>>;
  let categoryRepository: jest.Mocked<Repository<CategoryEntity>>;
  let reviewRepository: jest.Mocked<Repository<ReviewEntity>>;
  let inventoryServiceClient: jest.Mocked<ClientProxy>;
  let userServiceClient: jest.Mocked<ClientProxy>;
  const productRepositoryQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  } as unknown as jest.Mocked<SelectQueryBuilder<ProductEntity>>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: {
            createQueryBuilder: jest
              .fn()
              .mockReturnValue(productRepositoryQueryBuilder),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: USER_SERVICE,
          useValue: {
            send: jest.fn().mockReturnValue(of({})),
            pipe: jest.fn().mockReturnValue(of({})),
          },
        },
        {
          provide: INVENTORY_SERVICE,
          useValue: {
            emit: jest.fn().mockReturnValue(of({})),
            subscribe: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
    }).compile();

    productService = app.get<ProductService>(ProductService);
    productRepository = app.get<jest.Mocked<Repository<ProductEntity>>>(
      getRepositoryToken(ProductEntity),
    );
    categoryRepository = app.get<jest.Mocked<Repository<CategoryEntity>>>(
      getRepositoryToken(CategoryEntity),
    );
    reviewRepository = app.get<jest.Mocked<Repository<ReviewEntity>>>(
      getRepositoryToken(ReviewEntity),
    );
    inventoryServiceClient =
      app.get<jest.Mocked<ClientProxy>>(INVENTORY_SERVICE);
    userServiceClient = app.get<jest.Mocked<ClientProxy>>(USER_SERVICE);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(productService).toBeDefined();
    });
  });

  describe('PRODUCTS', () => {
    describe('getProducts', () => {
      let result: ProductWithCategory[];
      const products = ['product1', 'product2'] as unknown as ProductEntity[];
      let payload: GetProductsQueryPayload = {};

      beforeEach(async () => {
        productRepositoryQueryBuilder.getMany.mockResolvedValue(products);
        result = await productService.getProducts(payload);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should return products with default sorting', () => {
        expect(productRepository.createQueryBuilder).toHaveBeenCalledWith(
          'product',
        );
        expect(
          productRepositoryQueryBuilder.leftJoinAndSelect,
        ).toHaveBeenCalledWith('product.category', 'category');
        expect(productRepositoryQueryBuilder.orderBy).toHaveBeenCalledWith(
          'product.createdAt',
          'DESC',
        );
        expect(productRepositoryQueryBuilder.getMany).toHaveBeenCalled();
        expect(result).toEqual(products);
      });

      it('should apply search filter', async () => {
        payload = { search: 'test' };
        await productService.getProducts(payload);

        expect(productRepositoryQueryBuilder.andWhere).toHaveBeenCalledWith(
          'product.name ILIKE :search OR product.description ILIKE :search',
          { search: `%${payload.search}%` },
        );
      });

      it('should apply category filter', async () => {
        payload = { categoryId: 22 };
        await productService.getProducts(payload);

        expect(productRepositoryQueryBuilder.andWhere).toHaveBeenCalledWith(
          'product.categoryId = :categoryId',
          { categoryId: payload.categoryId },
        );
      });

      it('should apply ascending sort', async () => {
        payload = { sort: 'asc' };
        await productService.getProducts(payload);

        expect(productRepositoryQueryBuilder.orderBy).toHaveBeenCalledWith(
          'product.createdAt',
          'ASC',
        );
      });

      it('should apply descending sort', async () => {
        payload = { sort: 'desc' };
        await productService.getProducts(payload);

        expect(productRepositoryQueryBuilder.orderBy).toHaveBeenCalledWith(
          'product.createdAt',
          'DESC',
        );
      });

      it('should apply productIds filter', async () => {
        payload = { productIds: [1, 2, 3] };
        await productService.getProducts(payload);

        expect(productRepositoryQueryBuilder.andWhere).toHaveBeenCalledWith(
          'product.id IN (:...productIds)',
          { productIds: payload.productIds },
        );
      });
    });

    describe('getProductById', () => {
      let result: ProductWithCategory;
      const id = 5;
      const product = {
        id,
        name: 'test',
      } as ProductEntity;

      it('should return product when found', async () => {
        productRepository.findOne.mockResolvedValue(product);
        result = await productService.getProductById(id);

        expect(result).toEqual(product);
      });

      it('should throw RpcException when product not found', async () => {
        productRepository.findOne.mockResolvedValue(null);
        await expect(productService.getProductById(id)).rejects.toThrow(
          RpcException,
        );
      });
    });

    describe('createProduct', () => {
      let result: ProductWithCategory;
      const payload: CreateProductPayload = {
        name: 'test',
        description: 'description-2',
        price: 123,
        sku: 'asd',
        categoryId: 2,
      };
      const product = {
        id: 5,
        name: 'test',
        description: 'description-2',
        price: 123,
        sku: 'asd',
        category: { id: payload.categoryId },
      } as ProductEntity;

      beforeEach(async () => {
        productRepository.create.mockReturnValue(product);
        productRepository.save.mockResolvedValue(product);
        categoryRepository.findOneBy.mockResolvedValue({
          id: payload.categoryId,
        } as CategoryEntity);
        result = await productService.createProduct(payload);
      });

      it('should throw RpcException when with the same name already exists', async () => {
        productRepository.findOneBy.mockResolvedValueOnce(product);
        await expect(productService.createProduct(payload)).rejects.toThrow(
          RpcException,
        );
      });

      it('should save product in the database', () => {
        expect(productRepository.save).toHaveBeenCalledWith({
          id: expect.any(Number),
          name: payload.name,
          description: payload.description,
          price: payload.price,
          sku: payload.sku,
          category: { id: payload.categoryId },
        });
      });

      it('should emit product_created event', () => {
        expect(inventoryServiceClient.emit).toHaveBeenCalledWith(
          ProductEvents.Created,
          { productId: product.id },
        );
      });

      it('should return created product with category', () => {
        expect(result).toEqual(product);
      });

      it('should return created product without category if not provided', async () => {
        delete payload.categoryId;
        const { category, ...rest } = product;
        productRepository.save.mockResolvedValue(rest as ProductEntity);
        result = await productService.createProduct(payload);

        expect(result).toEqual({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          sku: product.sku,
        });
      });
    });

    describe('updateInventoryForProduct', () => {
      const payload: InventoryCreatedPayload = {
        productId: 1,
        inventoryId: 2,
      };
      const product = {
        id: payload.productId,
        inventory: { id: payload.inventoryId },
      } as ProductEntity;

      it('should throw RpcException when product not found', async () => {
        productRepository.findOne.mockResolvedValue(null);
        await expect(
          productService.updateInventoryForProduct(payload),
        ).rejects.toThrow(RpcException);
      });

      it('should update product inventory', async () => {
        productRepository.findOne.mockResolvedValue(product);
        await productService.updateInventoryForProduct(payload);

        expect(productRepository.update).toHaveBeenCalledWith(product.id, {
          inventory: { id: product.inventory.id },
        });
      });
    });

    describe('updateProduct', () => {
      let result: ProductWithCategory;
      const payload: Partial<CreateProductPayload> & { id: number } = {
        id: 2,
        name: 'name',
        price: 200,
      };
      const product = {
        id: payload.id,
        name: payload.name,
        description: '123',
        price: payload.price,
        sku: 'sku',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ProductEntity;

      beforeEach(async () => {
        productRepository.findOne.mockResolvedValue(product);
        productRepository.save.mockResolvedValue(product);
        result = await productService.updateProduct(payload);
      });

      it('should throw RpcException when product not found', async () => {
        productRepository.findOne.mockResolvedValue(null);
        await expect(productService.updateProduct(payload)).rejects.toThrow(
          RpcException,
        );
      });

      it('should update product in the database', () => {
        expect(productRepository.save).toHaveBeenCalledWith(product);
      });

      it('should update product with category in the database if category id provided', async () => {
        const payloadWithCategory = { ...payload, categoryId: 1 };
        product.category = {
          id: payloadWithCategory.categoryId,
        } as CategoryEntity;
        categoryRepository.findOneBy.mockResolvedValue(product.category);
        await productService.updateProduct(payloadWithCategory);

        expect(productRepository.save).toHaveBeenCalledWith(product);
      });

      it('should return updated product', () => {
        expect(result).toEqual(product);
      });
    });

    describe('deleteProduct', () => {
      let result: ProductWithCategory;
      const id = 222;
      const product = {
        id,
        name: 'test',
      } as ProductEntity;

      beforeEach(async () => {
        productRepository.findOne.mockResolvedValue(product);
        productRepository.remove.mockResolvedValue(product);
        result = await productService.deleteProduct(id);
      });

      it('should throw RpcException when product not found', async () => {
        productRepository.findOne.mockResolvedValue(null);
        await expect(productService.deleteProduct(id)).rejects.toThrow(
          RpcException,
        );
      });

      it('should delete product in the database', async () => {
        expect(productRepository.remove).toHaveBeenCalledWith(product);
      });

      it('should return deleted product', async () => {
        expect(result).toEqual(product);
      });
    });
  });

  describe('REVIEWS', () => {
    describe('getReviews', () => {
      let result: Review[];
      const id = 5;
      const reviews = [
        {
          id: 1,
          rating: 5,
          comment: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
          product: { id },
          user: { id: 1 },
        },
      ] as ReviewEntity[];

      beforeEach(async () => {
        reviewRepository.find.mockResolvedValue(reviews);
        result = await productService.getReviews(id);
      });

      // it('should throw RpcException when product not found', async () => {
      //   reviewRepository.find.mockResolvedValue([]);
      //   await expect(productService.getReviews(id)).rejects.toThrow(
      //     RpcException,
      //   );
      // });

      it('should return reviews', () => {
        expect(result).toEqual(
          reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            productId: r.product.id,
            user: r.user,
          })),
        );
      });

      it('should return empty array when reviews not found', async () => {
        reviewRepository.find.mockResolvedValue([]);
        result = await productService.getReviews(id);
        expect(result).toEqual([]);
      });
    });

    describe('createReview', () => {
      let result: Review;
      const payload: CreateReviewPayload = {
        productId: 1,
        userId: 1,
        rating: 3,
        comment: 'test',
      };
      const product = {
        id: payload.productId,
        name: 'test',
        description: 'description-2',
        price: 123,
        sku: 'asd',
        category: { id: 6 },
      } as ProductEntity;
      const review = {
        id: 1,
        rating: payload.rating,
        comment: payload.comment,
        product: product,
        user: { id: payload.userId },
      } as ReviewEntity;

      beforeEach(async () => {
        productRepository.findOneBy.mockResolvedValue(product);
        reviewRepository.create.mockReturnValue(review);
        reviewRepository.save.mockResolvedValue(review);
        result = await productService.createReview(payload);
      });

      it('should throw RpcException when product not found', async () => {
        productRepository.findOneBy.mockResolvedValueOnce(null);
        await expect(productService.createReview(payload)).rejects.toThrow(
          RpcException,
        );
      });

      it('should get user from user service', () => {
        expect(userServiceClient.send).toHaveBeenCalledWith(
          UserCommands.GetById,
          {
            id: payload.userId,
          },
        );
      });

      it('should save review in the database', () => {
        expect(reviewRepository.save).toHaveBeenCalledWith(review);
      });

      it('should return created review', () => {
        expect(result).toEqual({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          productId: review.product.id,
          user: review.user,
        });
      });
    });

    describe('deleteReview', () => {
      let result: Review;
      const payload: DeleteReviewPayload = {
        productId: 2,
        reviewId: 3,
        userId: 1,
      };
      const review = {
        id: 1,
        rating: 4,
        product: { id: payload.productId },
      } as ReviewEntity;

      beforeEach(async () => {
        reviewRepository.findOne.mockResolvedValue(review);
        reviewRepository.remove.mockResolvedValue(review);
        result = await productService.deleteReview(payload);
      });

      it('should throw RpcException when review not found', async () => {
        reviewRepository.findOne.mockResolvedValueOnce(null);
        await expect(productService.deleteReview(payload)).rejects.toThrow(
          RpcException,
        );
      });

      it('should delete review in the database', () => {
        expect(reviewRepository.remove).toHaveBeenCalledWith(review);
      });

      it('should return deleted review', () => {
        expect(result).toEqual({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          productId: review.product.id,
          user: review.user,
        });
      });
    });
  });

  describe('CATEGORIES', () => {
    describe('getCategories', () => {
      let result: Category[];
      const categories = [
        {
          id: 1,
          name: 'name',
          description: 'description',
        },
      ] as CategoryEntity[];

      beforeEach(async () => {
        categoryRepository.find.mockResolvedValue(categories);
        result = await productService.getCategories();
      });

      it('should return categories', () => {
        expect(result).toEqual(categories);
      });

      it('should return empty array when categories not found', async () => {
        categoryRepository.find.mockResolvedValue([]);
        result = await productService.getCategories();
        expect(result).toEqual([]);
      });
    });

    describe('createCategory', () => {
      let result: Category;
      const payload: CreateCategoryDto = {
        name: 'test',
        description: 'test',
      };
      const category = {
        id: 1,
        name: payload.name,
        description: payload.description,
      } as CategoryEntity;

      beforeEach(async () => {
        categoryRepository.findOneBy.mockResolvedValue(null);
        categoryRepository.create.mockReturnValue(category);
        categoryRepository.save.mockResolvedValue(category);
        result = await productService.createCategory(payload);
      });

      it('should throw RpcException when with the same name already exists', async () => {
        categoryRepository.findOneBy.mockResolvedValueOnce(category);
        await expect(productService.createCategory(payload)).rejects.toThrow(
          RpcException,
        );
      });

      it('should save category in the database', () => {
        expect(categoryRepository.save).toHaveBeenCalledWith(category);
      });

      it('should return created category', () => {
        expect(result).toEqual({
          id: category.id,
          name: category.name,
          description: category.description,
        });
      });
    });

    describe('updateCategory', () => {
      let result: Category;
      const payload: UpdateCategoryDto = {
        id: 1,
        name: 'test',
        description: 'test',
      };
      const category = {
        id: payload.id,
        name: payload.name,
        description: payload.description,
      } as CategoryEntity;

      beforeEach(async () => {
        categoryRepository.findOneBy.mockResolvedValue(category);
        categoryRepository.save.mockResolvedValue(category);
        result = await productService.updateCategory(payload);
      });

      it('should throw RpcException when category not found', async () => {
        categoryRepository.findOneBy.mockResolvedValueOnce(null);
        await expect(productService.updateCategory(payload)).rejects.toThrow(
          RpcException,
        );
      });

      it('should save category in the database', () => {
        expect(categoryRepository.save).toHaveBeenCalledWith(category);
      });

      it('should return updated category', () => {
        expect(result).toEqual({
          id: category.id,
          name: category.name,
          description: category.description,
        });
      });
    });

    describe('deleteCategory', () => {
      let result: Category;
      const id = 22;
      const category = {
        id,
        name: 'test',
        description: 'test',
      } as CategoryEntity;

      beforeEach(async () => {
        categoryRepository.findOneBy.mockResolvedValue(category);
        categoryRepository.remove.mockResolvedValue(category);
        result = await productService.deleteCategory(id);
      });

      it('should throw RpcException when category not found', async () => {
        categoryRepository.findOneBy.mockResolvedValueOnce(null);
        await expect(productService.deleteCategory(id)).rejects.toThrow(
          RpcException,
        );
      });

      it('should delete category in the database', async () => {
        expect(categoryRepository.remove).toHaveBeenCalledWith(category);
      });

      it('should return deleted category', () => {
        expect(result).toEqual({
          id: category.id,
          name: category.name,
          description: category.description,
        });
      });
    });
  });
});
