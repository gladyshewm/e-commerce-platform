import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InventoryEntity } from '@app/common/database/entities';
import {
  AddStockPayload,
  GetInventoryByProductIdPayload,
  Inventory,
  ProductCreatedPayload,
} from '@app/common/contracts/inventory';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PRODUCT_SERVICE } from '@app/common/constants';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly inventoryRepository: Repository<InventoryEntity>;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(PRODUCT_SERVICE)
    private readonly productServiceClient: ClientProxy,
  ) {
    this.inventoryRepository = this.dataSource.getRepository(InventoryEntity);
  }

  async createInventory(payload: ProductCreatedPayload) {
    try {
      const exists = await this.inventoryRepository.findOneBy({
        product: { id: payload.productId },
      });

      if (exists) {
        throw new RpcException({
          message: `Inventory for product with ID ${payload.productId} already exists`,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const inventory = this.inventoryRepository.create({
        product: { id: payload.productId },
      });
      await this.inventoryRepository.save(inventory);

      this.logger.log(
        `Created inventory for product with ID ${payload.productId}`,
      );

      this.productServiceClient
        .emit('inventory_created', {
          productId: payload.productId,
          inventoryId: inventory.id,
        })
        .subscribe();
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

  // TODO: add pagination (queryBuilder)
  async getInventories(): Promise<Inventory[]> {
    try {
      const inventories = await this.inventoryRepository.find({
        relations: ['product'],
      });
      return inventories.map((inventory) => ({
        id: inventory.id,
        availableQuantity: inventory.availableQuantity,
        reservedQuantity: inventory.reservedQuantity,
        updatedAt: inventory.updatedAt,
        productId: inventory.product.id,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get inventories: ${error.message}`,
        error.stack,
      );
      throw new RpcException({
        message: `Failed to get inventories: ${error.message}`,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getInventoryByProductId(
    payload: GetInventoryByProductIdPayload,
  ): Promise<Inventory> {
    const inventory = await this.findInventoryById(payload.productId);
    return {
      id: inventory.id,
      availableQuantity: inventory.availableQuantity,
      reservedQuantity: inventory.reservedQuantity,
      updatedAt: inventory.updatedAt,
      productId: inventory.product.id,
    };
  }

  async addStock(payload: AddStockPayload): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { product: { id: payload.productId } },
      relations: ['product'],
    });

    if (!inventory) {
      this.logger.error(
        `Inventory for product with ID ${payload.productId} not found`,
      );
      throw new RpcException({
        message: `Inventory for product with ID ${payload.productId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    inventory.availableQuantity += payload.quantity;
    const updatedInventory = await this.inventoryRepository.save(inventory);
    this.logger.log(
      `Added ${payload.quantity} items in stock to inventory for product with ID ${payload.productId}`,
    );

    return {
      id: updatedInventory.id,
      availableQuantity: updatedInventory.availableQuantity,
      reservedQuantity: updatedInventory.reservedQuantity,
      updatedAt: updatedInventory.updatedAt,
      productId: updatedInventory.product.id,
    };
  }

  private async findInventoryById(productId: number): Promise<InventoryEntity> {
    const inventory = await this.inventoryRepository.findOne({
      where: { product: { id: productId } },
      relations: ['product'],
    });

    if (!inventory) {
      this.logger.error(`Inventory for product with ID ${productId} not found`);
      throw new RpcException({
        message: `Inventory for product with ID ${productId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return inventory;
  }

  private async findInventoriesByIds(
    productIds: number[],
  ): Promise<InventoryEntity[]> {
    const inventories = await this.inventoryRepository.find({
      where: productIds.map((id) => ({ product: { id } })),
      relations: ['product'],
    });

    if (inventories.length !== productIds.length) {
      this.logger.warn(
        `Inventory for some of the products with ids ${productIds} not found`,
      );
    }

    return inventories;
  }

  async reserveOne(payload: AddStockPayload): Promise<Inventory> {
    return (await this.reserveMany([payload]))[0];
  }

  async releaseReserveOne(payload: AddStockPayload): Promise<Inventory> {
    return (await this.releaseReserveMany([payload]))[0];
  }

  async commitReserveOne(payload: AddStockPayload): Promise<Inventory> {
    return (await this.commitReserveMany([payload]))[0];
  }

  private async processMany(
    payload: AddStockPayload[],
    handler: (inv: InventoryEntity, item: AddStockPayload) => void,
    validator?: (inv: InventoryEntity, item: AddStockPayload) => void,
  ): Promise<Inventory[]> {
    const inventories = await this.findInventoriesByIds(
      payload.map((i) => i.productId),
    );

    const missing = payload
      .map((item) => item.productId)
      .filter((id) => !inventories.some((inv) => inv.product.id === id));
    if (missing.length) {
      this.logger.error(
        `Inventory not found for productIds: ${missing.join(', ')}`,
      );
      throw new RpcException({
        message: `Inventory not found for productIds: ${missing.join(', ')}`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (validator) {
      for (const item of payload) {
        const inv = inventories.find((x) => x.product.id === item.productId)!;
        try {
          validator(inv, item);
        } catch (e) {
          this.logger.error(e.message);
          throw new RpcException({
            message: e.message,
            statusCode: HttpStatus.BAD_REQUEST,
          });
        }
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const result: Inventory[] = [];

      for (const item of payload) {
        const inv = inventories.find((x) => x.product.id === item.productId)!;
        handler(inv, item);
        const saved = await manager.save(inv);
        result.push({
          id: saved.id,
          availableQuantity: saved.availableQuantity,
          reservedQuantity: saved.reservedQuantity,
          updatedAt: saved.updatedAt,
          productId: item.productId,
        });
      }

      return result;
    });
  }

  private ensureSufficientStock(inv: InventoryEntity, item: AddStockPayload) {
    if (inv.availableQuantity < item.quantity) {
      throw new Error(`Not enough stock for product with ID ${item.productId}`);
    }
  }

  async reserveMany(payload: AddStockPayload[]): Promise<Inventory[]> {
    return this.processMany(
      payload,
      (inv, item) => {
        inv.availableQuantity -= item.quantity;
        inv.reservedQuantity += item.quantity;
        this.logger.log(
          `Reserved ${item.quantity} for product with ID ${item.productId}`,
        );
      },
      this.ensureSufficientStock.bind(this),
    );
  }

  async releaseReserveMany(payload: AddStockPayload[]): Promise<Inventory[]> {
    return this.processMany(payload, (inventory, item) => {
      inventory.availableQuantity += item.quantity;
      inventory.reservedQuantity -= item.quantity;
      this.logger.log(
        `Released ${item.quantity} items for product with ID ${item.productId}`,
      );
    });
  }

  async commitReserveMany(payload: AddStockPayload[]): Promise<Inventory[]> {
    return this.processMany(payload, (inventory, item) => {
      inventory.reservedQuantity -= item.quantity;
      this.logger.log(
        `Committed ${item.quantity} items for product with ID ${item.productId}`,
      );
    });
  }
}
