import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { RmqService } from '@app/rmq';
import { RmqContext } from '@nestjs/microservices';
import {
  Category,
  ProductWithCategory,
  Review,
} from '@app/common/contracts/product';
import { GetProductsQueryDto } from './dto/product/product-get.dto';
import { GetProductByIdDto } from './dto/product/product-get-by-id.dto';
import { CreateProductDto } from './dto/product/product-create.dto';
import { InventoryCreatedDto } from './dto/product/inventory-created.dto';
import { InventoryCreateFailedDto } from './dto/product/inventory-create-failed.dto';
import { UpdateProductDto } from './dto/product/product-update.dto';
import { DeleteProductDto } from './dto/product/product-delete.dto';
import { GetReviewsByProductId } from './dto/review/review-get.dto';
import { CreateReviewDto } from './dto/review/review-create.dto';
import { DeleteReviewDto } from './dto/review/review-delete.dto';
import { CreateCategoryDto } from './dto/category/category-create.dto';
import { UpdateCategoryDto } from './dto/category/category-update.dto';
import { DeleteCategoryDto } from './dto/category/category-delete.dto';

jest.mock('./product.service');

describe('ProductController', () => {
  let productController: ProductController;
  let productService: jest.Mocked<ProductService>;
  let rmqService: jest.Mocked<RmqService>;
  const context = {} as RmqContext;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        ProductService,
        {
          provide: RmqService,
          useValue: {
            ack: jest.fn(),
          },
        },
      ],
    }).compile();

    productController = app.get<ProductController>(ProductController);
    productService = app.get<jest.Mocked<ProductService>>(ProductService);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(productController).toBeDefined();
    });
  });

  describe('PRODUCTS', () => {
    describe('getProducts', () => {
      let result: ProductWithCategory[];
      const products: ProductWithCategory[] = [
        {
          id: 1,
          name: 'name',
          description: 'description',
          price: 123,
          sku: 'zxc-1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: {
            id: 1,
            name: 'qwe',
          },
        },
      ];
      const payload: GetProductsQueryDto = {
        search: 'car',
        sort: 'desc',
      };

      beforeEach(async () => {
        productService.getProducts.mockResolvedValue(products);
        result = await productController.getProducts(payload, context);
      });

      it('should call productService', () => {
        expect(productService.getProducts).toHaveBeenCalledWith(payload);
        expect(productService.getProducts).toHaveBeenCalledTimes(1);
      });

      it('should return products', () => {
        expect(result).toEqual(products);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('getProductById', () => {
      let result: ProductWithCategory;
      const product: ProductWithCategory = {
        id: 1,
        name: 'name',
        description: 'description',
        price: 123,
        sku: 'zxc-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 1,
          name: 'qwe',
        },
      };
      const payload: GetProductByIdDto = { id: 123 };

      beforeEach(async () => {
        productService.getProductById.mockResolvedValue(product);
        result = await productController.getProductById(payload, context);
      });

      it('should call productService', () => {
        expect(productService.getProductById).toHaveBeenCalledWith(payload.id);
        expect(productService.getProductById).toHaveBeenCalledTimes(1);
      });

      it('should return product', () => {
        expect(result).toEqual(product);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('createProduct', () => {
      let result: ProductWithCategory;
      const payload: CreateProductDto = {
        name: 'name',
        description: 'description-2',
        price: 123,
        sku: 'asd',
        categoryId: 2,
      };
      const product: ProductWithCategory = {
        id: 1,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        sku: payload.sku,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: payload.categoryId,
          name: 'qwe',
        },
      };

      beforeEach(async () => {
        productService.createProduct.mockResolvedValue(product);
        result = await productController.createProduct(payload, context);
      });

      it('should call productService', () => {
        expect(productService.createProduct).toHaveBeenCalledWith(payload);
        expect(productService.createProduct).toHaveBeenCalledTimes(1);
      });

      it('should return product', () => {
        expect(result).toEqual(product);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('inventoryCreatedHandler', () => {
      const payload: InventoryCreatedDto = {
        productId: 1,
        inventoryId: 2,
      };

      beforeEach(async () => {
        await productController.inventoryCreatedHandler(payload, context);
      });

      it('should call productService', () => {
        expect(productService.updateInventoryForProduct).toHaveBeenCalledWith(
          payload,
        );
        expect(productService.updateInventoryForProduct).toHaveBeenCalledTimes(
          1,
        );
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('inventoryCreateFailedHandler', () => {
      const payload: InventoryCreateFailedDto = { productId: 1 };

      beforeEach(async () => {
        await productController.inventoryCreateFailedHandler(payload, context);
      });

      it('should call productService', () => {
        expect(productService.deleteProduct).toHaveBeenCalledWith(
          payload.productId,
        );
        expect(productService.deleteProduct).toHaveBeenCalledTimes(1);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('updateProduct', () => {
      let result: ProductWithCategory;
      const payload: UpdateProductDto = {
        id: 2,
        name: 'name',
        price: 200,
      };
      const product: ProductWithCategory = {
        id: payload.id,
        name: payload.name,
        description: '123',
        price: payload.price,
        sku: 'sku',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 1,
          name: 'qwe',
        },
      };

      beforeEach(async () => {
        productService.updateProduct.mockResolvedValue(product);
        result = await productController.updateProduct(payload, context);
      });

      it('should call productService', () => {
        expect(productService.updateProduct).toHaveBeenCalledWith(payload);
        expect(productService.updateProduct).toHaveBeenCalledTimes(1);
      });

      it('should return product', () => {
        expect(result).toEqual(product);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('deleteProduct', () => {
      let result: ProductWithCategory;
      const payload: DeleteProductDto = { id: 2 };
      const product: ProductWithCategory = {
        id: payload.id,
        name: 'name',
        description: '123',
        price: 123,
        sku: 'sku',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 1,
          name: 'qwe',
        },
      };

      beforeEach(async () => {
        productService.deleteProduct.mockResolvedValue(product);
        result = await productController.deleteProduct(payload, context);
      });

      it('should call productService', () => {
        expect(productService.deleteProduct).toHaveBeenCalledWith(payload.id);
        expect(productService.deleteProduct).toHaveBeenCalledTimes(1);
      });

      it('should return product', () => {
        expect(result).toEqual(product);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });
  });

  describe('REVIEWS', () => {
    describe('getReviews', () => {
      let result: Review[];
      const payload: GetReviewsByProductId = { productId: 2 };
      const reviews = [
        {
          id: 1,
          rating: 4,
        },
      ] as Review[];

      beforeEach(async () => {
        productService.getReviews.mockResolvedValue(reviews);
        result = await productController.getReviews(payload, context);
      });

      it('should call productService', () => {
        expect(productService.getReviews).toHaveBeenCalledWith(
          payload.productId,
        );
        expect(productService.getReviews).toHaveBeenCalledTimes(1);
      });

      it('should return reviews', () => {
        expect(result).toEqual(reviews);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('createReview', () => {
      let result: Review;
      const payload: CreateReviewDto = {
        productId: 2,
        userId: 1,
        rating: 1,
        comment: 'comment',
      };
      const review = {
        id: 1,
        rating: 4,
      } as Review;

      beforeEach(async () => {
        productService.createReview.mockResolvedValue(review);
        result = await productController.createReview(payload, context);
      });

      it('should call productService', () => {
        expect(productService.createReview).toHaveBeenCalledWith(payload);
        expect(productService.createReview).toHaveBeenCalledTimes(1);
      });

      it('should return review', () => {
        expect(result).toEqual(review);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('deleteReview', () => {
      let result: Review;
      const payload: DeleteReviewDto = {
        productId: 2,
        reviewId: 3,
        userId: 1,
      };
      const review = {
        id: 1,
        rating: 4,
      } as Review;

      beforeEach(async () => {
        productService.deleteReview.mockResolvedValue(review);
        result = await productController.deleteReview(payload, context);
      });

      it('should call productService', () => {
        expect(productService.deleteReview).toHaveBeenCalledWith(payload);
        expect(productService.deleteReview).toHaveBeenCalledTimes(1);
      });

      it('should return review', () => {
        expect(result).toEqual(review);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });
  });

  describe('CATEGORIES', () => {
    describe('getCategories', () => {
      let result: Category[];
      const categories: Category[] = [
        {
          id: 1,
          name: 'name',
          description: 'description',
        },
      ];

      beforeEach(async () => {
        productService.getCategories.mockResolvedValue(categories);
        result = await productController.getCategories(context);
      });

      it('should call productService', () => {
        expect(productService.getCategories).toHaveBeenCalledTimes(1);
      });

      it('should return review', () => {
        expect(result).toEqual(categories);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('createCategory', () => {
      let result: Category;
      const payload: CreateCategoryDto = {
        name: 'test',
        description: 'test',
      };
      const category: Category = {
        id: 1,
        name: 'name',
        description: 'description',
      };

      beforeEach(async () => {
        productService.createCategory.mockResolvedValue(category);
        result = await productController.createCategory(payload, context);
      });

      it('should call productService', () => {
        expect(productService.createCategory).toHaveBeenCalledWith(payload);
        expect(productService.createCategory).toHaveBeenCalledTimes(1);
      });

      it('should return review', () => {
        expect(result).toEqual(category);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('updateCategory', () => {
      let result: Category;
      const payload: UpdateCategoryDto = {
        id: 1,
        name: 'test',
      };
      const category: Category = {
        id: payload.id,
        name: payload.name,
        description: 'description',
      };

      beforeEach(async () => {
        productService.updateCategory.mockResolvedValue(category);
        result = await productController.updateCategory(payload, context);
      });

      it('should call productService', () => {
        expect(productService.updateCategory).toHaveBeenCalledWith(payload);
        expect(productService.updateCategory).toHaveBeenCalledTimes(1);
      });

      it('should return review', () => {
        expect(result).toEqual(category);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });

    describe('deleteCategory', () => {
      let result: Category;
      const payload: DeleteCategoryDto = { id: 1 };
      const category: Category = {
        id: payload.id,
        name: 'test',
        description: 'description',
      };

      beforeEach(async () => {
        productService.deleteCategory.mockResolvedValue(category);
        result = await productController.deleteCategory(payload, context);
      });

      it('should call productService', () => {
        expect(productService.deleteCategory).toHaveBeenCalledWith(payload.id);
        expect(productService.deleteCategory).toHaveBeenCalledTimes(1);
      });

      it('should return review', () => {
        expect(result).toEqual(category);
      });

      it('should call ack', () => {
        expect(rmqService.ack).toHaveBeenCalledTimes(1);
        expect(rmqService.ack).toHaveBeenCalledWith(context);
      });
    });
  });
});
