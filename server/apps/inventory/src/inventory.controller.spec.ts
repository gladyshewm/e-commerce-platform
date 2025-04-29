import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { RmqService } from '@app/rmq';
import { CreateInventoryDto } from './dto/inventory-create.dto';
import { RmqContext } from '@nestjs/microservices';
import { Inventory } from '@app/common/contracts/inventory';
import { AddStockDto } from './dto/inventory-add-stock.dto';

jest.mock('./inventory.service');

describe('InventoryController', () => {
  let inventoryController: InventoryController;
  let inventoryService: jest.Mocked<InventoryService>;
  let rmqService: jest.Mocked<RmqService>;
  const ctx = {} as RmqContext;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        InventoryService,
        {
          provide: RmqService,
          useValue: {
            ack: jest.fn(),
          },
        },
      ],
    }).compile();

    inventoryController = app.get<InventoryController>(InventoryController);
    inventoryService = app.get<jest.Mocked<InventoryService>>(InventoryService);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(inventoryController).toBeDefined();
    });
  });

  describe('handleProductCreated', () => {
    const payload: CreateInventoryDto = {
      productId: 1,
    };

    beforeEach(async () => {
      await inventoryController.handleProductCreated(payload, ctx);
    });

    it('should call inventoryService', () => {
      expect(inventoryService.createInventory).toHaveBeenCalledWith(payload);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('addStock', () => {
    let result: Inventory;
    const payload: AddStockDto = {
      productId: 1,
      quantity: 1,
    };
    const inventory = {
      id: 1,
      productId: payload.productId,
    } as Inventory;

    beforeEach(async () => {
      inventoryService.addStock.mockResolvedValue(inventory);
      result = await inventoryController.addStock(payload, ctx);
    });

    it('should call inventoryService', () => {
      expect(inventoryService.addStock).toHaveBeenCalledWith(payload);
    });

    it('should return updated inventory', () => {
      expect(result).toEqual(inventory);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('reserveOne', () => {
    let result: Inventory;
    const payload: AddStockDto = {
      productId: 1,
      quantity: 1,
    };
    const inventory = {
      id: 1,
      productId: payload.productId,
    } as Inventory;

    beforeEach(async () => {
      inventoryService.reserveOne.mockResolvedValue(inventory);
      result = await inventoryController.reserveOne(payload, ctx);
    });

    it('should call inventoryService', () => {
      expect(inventoryService.reserveOne).toHaveBeenCalledWith(payload);
    });

    it('should return updated inventory', () => {
      expect(result).toEqual(inventory);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('reserveMany', () => {
    let result: Inventory[];
    const payload: AddStockDto[] = [
      {
        productId: 1,
        quantity: 1,
      },
    ];
    const inventories = [
      {
        id: 1,
        productId: 2,
      },
    ] as Inventory[];

    beforeEach(async () => {
      inventoryService.reserveMany.mockResolvedValue(inventories);
      result = await inventoryController.reserveMany(payload, ctx);
    });

    it('should call inventoryService', () => {
      expect(inventoryService.reserveMany).toHaveBeenCalledWith(payload);
    });

    it('should return updated inventories', () => {
      expect(result).toEqual(inventories);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('commitReserveOne', () => {
    let result: Inventory;
    const payload: AddStockDto = {
      productId: 1,
      quantity: 1,
    };
    const inventory = {
      id: 1,
      productId: payload.productId,
    } as Inventory;

    beforeEach(async () => {
      inventoryService.commitReserveOne.mockResolvedValue(inventory);
      result = await inventoryController.commitReserveOne(payload, ctx);
    });

    it('should call inventoryService', () => {
      expect(inventoryService.commitReserveOne).toHaveBeenCalledWith(payload);
    });

    it('should return updated inventory', () => {
      expect(result).toEqual(inventory);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('commitReserveMany', () => {
    let result: Inventory[];
    const payload: AddStockDto[] = [
      {
        productId: 1,
        quantity: 1,
      },
    ];
    const inventories = [
      {
        id: 1,
        productId: 2,
      },
    ] as Inventory[];

    beforeEach(async () => {
      inventoryService.commitReserveMany.mockResolvedValue(inventories);
      result = await inventoryController.commitReserveMany(payload, ctx);
    });

    it('should call inventoryService', () => {
      expect(inventoryService.commitReserveMany).toHaveBeenCalledWith(payload);
    });

    it('should return updated inventories', () => {
      expect(result).toEqual(inventories);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('releaseReserveOne', () => {
    let result: Inventory;
    const payload: AddStockDto = {
      productId: 1,
      quantity: 1,
    };
    const inventory = {
      id: 1,
      productId: payload.productId,
    } as Inventory;

    beforeEach(async () => {
      inventoryService.releaseReserveOne.mockResolvedValue(inventory);
      result = await inventoryController.releaseReserveOne(payload, ctx);
    });

    it('should call inventoryService', () => {
      expect(inventoryService.releaseReserveOne).toHaveBeenCalledWith(payload);
    });

    it('should return updated inventory', () => {
      expect(result).toEqual(inventory);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('releaseReserveMany', () => {
    let result: Inventory[];
    const payload: AddStockDto[] = [
      {
        productId: 1,
        quantity: 1,
      },
    ];
    const inventories = [
      {
        id: 1,
        productId: 2,
      },
    ] as Inventory[];

    beforeEach(async () => {
      inventoryService.releaseReserveMany.mockResolvedValue(inventories);
      result = await inventoryController.releaseReserveMany(payload, ctx);
    });

    it('should call inventoryService', () => {
      expect(inventoryService.releaseReserveMany).toHaveBeenCalledWith(payload);
    });

    it('should return updated inventories', () => {
      expect(result).toEqual(inventories);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });
});
