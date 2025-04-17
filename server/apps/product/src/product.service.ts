import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  Category,
  CreateCategoryPayload,
  CreateProductPayload,
  GetProductsQueryPayload,
  ProductWithCategory,
} from '@app/common/contracts/product';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity, ProductEntity } from '@app/common/database/entities';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async getProducts(
    payload: GetProductsQueryPayload,
  ): Promise<ProductWithCategory[]> {
    const { search, sort, categoryId } = payload; // TODO: limit, offset
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

    const products = await query.getMany();
    return products;
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
