import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
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
        this.logger.error(
          `Inventory for product with id ${payload.productId} already exists`,
        );
        throw new RpcException({
          message: `Inventory for product with id ${payload.productId} already exists`,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const inventory = this.inventoryRepository.create({
        product: { id: payload.productId },
      });
      await this.inventoryRepository.save(inventory);

      this.logger.log(
        `Created inventory for product with id ${payload.productId}`,
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

  private async findInventoryById(productId: number): Promise<InventoryEntity> {
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

  private async runInventoriesTransaction(
    payload: AddStockPayload[],
    handler: (inventory: InventoryEntity, item: AddStockPayload) => void,
  ): Promise<Inventory[]> {
    const inventories = await this.findInventoriesByIds(
      payload.map((item) => item.productId),
    );

    return this.dataSource.transaction(async (manager) => {
      const updatedInventories: Inventory[] = [];

      for (const item of payload) {
        const inventory = inventories.find(
          (inv) => inv.product.id === item.productId,
        );

        if (!inventory) {
          this.logger.error(
            `Inventory not found for productId ${item.productId}`,
          );
          throw new RpcException({
            message: `Inventory not found for productId ${item.productId}`,
            statusCode: HttpStatus.BAD_REQUEST,
          });
        }

        handler(inventory, item);

        const saved = await manager.save(inventory);
        updatedInventories.push({
          id: saved.id,
          availableQuantity: saved.availableQuantity,
          reservedQuantity: saved.reservedQuantity,
          updatedAt: saved.updatedAt,
          productId: item.productId,
        });
      }

      return updatedInventories;
    });
  }

  async reserveMany(payload: AddStockPayload[]): Promise<Inventory[]> {
    const inventories = await this.findInventoriesByIds(
      payload.map((item) => item.productId),
    );

    for (const item of payload) {
      const inventory = inventories.find(
        (inv) => inv.product.id === item.productId,
      );

      if (!inventory || inventory.availableQuantity < item.quantity) {
        this.logger.error(
          `Not enough stock for product with id ${item.productId}`,
        );
        throw new RpcException({
          message: `Not enough stock for product with id ${item.productId}`,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const updatedInventories: Inventory[] = [];
      for (const item of payload) {
        const inventory = inventories.find(
          (inv) => inv.product.id === item.productId,
        );

        inventory.availableQuantity -= item.quantity;
        inventory.reservedQuantity += item.quantity;
        const saved = await manager.save(inventory);
        this.logger.log(
          `Reserved ${item.quantity} items in stock to inventory for product with id ${item.productId}`,
        );
        updatedInventories.push({
          id: saved.id,
          availableQuantity: saved.availableQuantity,
          reservedQuantity: saved.reservedQuantity,
          updatedAt: saved.updatedAt,
          productId: item.productId,
        });
      }
      return updatedInventories;
    });
  }

  async releaseReserveMany(payload: AddStockPayload[]): Promise<Inventory[]> {
    return this.runInventoriesTransaction(payload, (inventory, item) => {
      inventory.availableQuantity += item.quantity;
      inventory.reservedQuantity -= item.quantity;
      this.logger.log(
        `Released ${item.quantity} items for productId ${item.productId}`,
      );
    });
  }

  async commitReserveMany(payload: AddStockPayload[]): Promise<Inventory[]> {
    return this.runInventoriesTransaction(payload, (inventory, item) => {
      inventory.reservedQuantity -= item.quantity;
      this.logger.log(
        `Committed ${item.quantity} items for productId ${item.productId}`,
      );
    });
  }
}
