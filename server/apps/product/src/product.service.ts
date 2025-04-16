import { Injectable, Logger } from '@nestjs/common';
import { Product } from '@app/common/contracts/product';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '@app/common/database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async getProducts(): Promise<Product[]> {
    return this.productRepository.find();
  }
}
