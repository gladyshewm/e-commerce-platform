import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  Category,
  CreateCategoryPayload,
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

  async getProducts(): Promise<ProductWithCategory[]> {
    const products = await this.productRepository.find({
      relations: ['category'],
    });
    return products;
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
