import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryEntity } from '@app/common/database/entities';
import {
  AddStockPayload,
  Inventory,
  ProductCreatedPayload,
} from '@app/common/contracts/inventory';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PRODUCT_SERVICE } from '@app/common/constants';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepository: Repository<InventoryEntity>,
    @Inject(PRODUCT_SERVICE)
    private readonly productServiceClient: ClientProxy,
  ) {}

  async createInventory(payload: ProductCreatedPayload) {
    try {
      const inventory = this.inventoryRepository.create({
        product: { id: payload.productId },
      });

      await this.inventoryRepository.save(inventory);
      this.logger.log(
        `Created inventory for product with id ${payload.productId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create inventory: ${error.message}`,
        error.stack,
      );
      this.productServiceClient
        .emit('inventory_create_failed', {
          productId: payload.productId,
        })
        .subscribe();
    }
  }

  async addStock(payload: AddStockPayload): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { product: { id: payload.productId } },
      relations: ['product'],
    });

    if (!inventory) {
      this.logger.error(
        `Inventory for product with id ${payload.productId} not found`,
      );
      throw new RpcException({
        message: `Inventory for product with id ${payload.productId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    inventory.availableQuantity += payload.quantity;
    const updatedInventory = await this.inventoryRepository.save(inventory);
    this.logger.log(
      `Added ${payload.quantity} items in stock to inventory for product with id ${payload.productId}`,
    );

    return {
      id: updatedInventory.id,
      availableQuantity: updatedInventory.availableQuantity,
      reservedQuantity: updatedInventory.reservedQuantity,
      updatedAt: updatedInventory.updatedAt,
      productId: updatedInventory.product.id,
    };
  }

  private async findInventoryById(productId: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { product: { id: productId } },
      relations: ['product'],
    });

    if (!inventory) {
      this.logger.error(`Inventory for product with id ${productId} not found`);
      throw new RpcException({
        message: `Inventory for product with id ${productId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return {
      id: inventory.id,
      availableQuantity: inventory.availableQuantity,
      reservedQuantity: inventory.reservedQuantity,
      updatedAt: inventory.updatedAt,
      productId: inventory.product.id,
    };
  }

  async reserve(payload: AddStockPayload): Promise<Inventory> {
    const inventory = await this.findInventoryById(payload.productId);

    if (inventory.availableQuantity < payload.quantity) {
      this.logger.error(
        `Not enough stock for product with id ${payload.productId}`,
      );
      throw new RpcException({
        message: `Not enough stock for product with id ${payload.productId}`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    inventory.availableQuantity -= payload.quantity;
    inventory.reservedQuantity += payload.quantity;
    const updatedInventory = await this.inventoryRepository.save(inventory);
    this.logger.log(
      `Reserved ${payload.quantity} items in stock to inventory for product with id ${payload.productId}`,
    );

    return {
      id: updatedInventory.id,
      availableQuantity: updatedInventory.availableQuantity,
      reservedQuantity: updatedInventory.reservedQuantity,
      updatedAt: updatedInventory.updatedAt,
      productId: inventory.productId,
    };
  }

  async releaseReserve(payload: AddStockPayload): Promise<Inventory> {
    const inventory = await this.findInventoryById(payload.productId);

    if (inventory.reservedQuantity < payload.quantity) {
      this.logger.error(
        `Not enough reserved stock for product with id ${payload.productId}`,
      );
      throw new RpcException({
        message: `Not enough reserved stock for product with id ${payload.productId}`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    inventory.availableQuantity += payload.quantity;
    inventory.reservedQuantity -= payload.quantity;
    const updatedInventory = await this.inventoryRepository.save(inventory);
    this.logger.log(
      `Released ${payload.quantity} items in stock to inventory for product with id ${payload.productId}`,
    );

    return {
      id: updatedInventory.id,
      availableQuantity: updatedInventory.availableQuantity,
      reservedQuantity: updatedInventory.reservedQuantity,
      updatedAt: updatedInventory.updatedAt,
      productId: inventory.productId,
    };
  }

  async commitReserve(payload: AddStockPayload): Promise<Inventory> {
    const inventory = await this.findInventoryById(payload.productId);

    if (inventory.reservedQuantity < payload.quantity) {
      this.logger.error(
        `Not enough reserved stock for product with id ${payload.productId}`,
      );
      throw new RpcException({
        message: `Not enough reserved stock for product with id ${payload.productId}`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    inventory.reservedQuantity -= payload.quantity;
    const updatedInventory = await this.inventoryRepository.save(inventory);
    this.logger.log(
      `Committed ${payload.quantity} items in stock to inventory for product with id ${payload.productId}`,
    );

    return {
      id: updatedInventory.id,
      availableQuantity: updatedInventory.availableQuantity,
      reservedQuantity: updatedInventory.reservedQuantity,
      updatedAt: updatedInventory.updatedAt,
      productId: inventory.productId,
    };
  }

  async reserveMany(payload: AddStockPayload[]): Promise<Inventory[]> {
    return Promise.all(payload.map((item) => this.reserve(item)));
  }

  async releaseReserveMany(payload: AddStockPayload[]): Promise<Inventory[]> {
    return Promise.all(payload.map((item) => this.releaseReserve(item)));
  }

  async commitReserveMany(payload: AddStockPayload[]): Promise<Inventory[]> {
    return Promise.all(payload.map((item) => this.commitReserve(item)));
  }
}
