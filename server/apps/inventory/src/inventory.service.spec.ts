import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PRODUCT_SERVICE } from '@app/common/constants';
import { of } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { InventoryEntity, ProductEntity } from '@app/common/database/entities';
import {
  AddStockPayload,
  GetInventoryByProductIdPayload,
  Inventory,
  ProductCreatedPayload,
} from '@app/common/contracts/inventory';

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let productServiceClient: jest.Mocked<ClientProxy>;
  let dataSource: jest.Mocked<DataSource>;
  let inventoryRepository: jest.Mocked<Repository<InventoryEntity>>;
  const dataSourceSaveMock = jest.fn();

  beforeEach(async () => {
    inventoryRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<InventoryEntity>>;

    dataSource = {
      getRepository: jest.fn().mockReturnValue(inventoryRepository),
      transaction: jest
        .fn()
        .mockImplementation(async (cb) => cb({ save: dataSourceSaveMock })),
    } as unknown as jest.Mocked<DataSource>;

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PRODUCT_SERVICE,
          useValue: {
            emit: jest.fn().mockReturnValue(of({})),
            subscribe: jest.fn().mockReturnValue(of({})),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    inventoryService = app.get<InventoryService>(InventoryService);
    productServiceClient = app.get<jest.Mocked<ClientProxy>>(PRODUCT_SERVICE);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(inventoryService).toBeDefined();
    });
  });

  describe('createInventory', () => {
    const payload: ProductCreatedPayload = {
      productId: 8,
    };
    const inventory = {
      id: 1,
      product: { id: payload.productId },
    } as InventoryEntity;

    beforeEach(async () => {
      inventoryRepository.create.mockReturnValue(inventory);
      inventoryRepository.save.mockResolvedValue(inventory);
      await inventoryService.createInventory(payload);
    });

    it('should emit inventory_create_failed if inventory for this product already exists', async () => {
      inventoryRepository.findOneBy.mockResolvedValueOnce({
        product: { id: payload.productId },
      } as InventoryEntity);
      await inventoryService.createInventory(payload);

      expect(productServiceClient.emit).toHaveBeenCalledWith(
        'inventory_create_failed',
        { productId: payload.productId },
      );
    });

    it('should save created inventory in the database', () => {
      expect(inventoryRepository.save).toHaveBeenCalledWith(inventory);
    });

    it('should emit inventory_created', () => {
      expect(productServiceClient.emit).toHaveBeenCalledWith(
        'inventory_created',
        { productId: payload.productId, inventoryId: inventory.id },
      );
    });
  });

  describe('getInventories', () => {
    let result: Inventory[];
    const inv: InventoryEntity = {
      id: 1,
      availableQuantity: 1,
      reservedQuantity: 1,
      updatedAt: new Date(),
      product: { id: 1 } as ProductEntity,
    };

    beforeEach(async () => {
      inventoryRepository.find.mockResolvedValue([inv]);
      result = await inventoryService.getInventories();
    });

    it('should return inventories', () => {
      expect(result).toEqual([
        {
          id: inv.id,
          availableQuantity: inv.availableQuantity,
          reservedQuantity: inv.reservedQuantity,
          updatedAt: inv.updatedAt,
          productId: inv.product.id,
        },
      ]);
    });

    it('should return empty array if no inventories', async () => {
      inventoryRepository.find.mockResolvedValue([]);
      result = await inventoryService.getInventories();

      expect(result).toEqual([]);
    });

    it('should throw RpcException if repository throws', async () => {
      inventoryRepository.find.mockRejectedValue(new Error('Some error'));
      await expect(inventoryService.getInventories()).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('getInventoryByProductId', () => {
    let result: Inventory;
    const payload: GetInventoryByProductIdPayload = { productId: 1 };
    const inv: InventoryEntity = {
      id: 1,
      availableQuantity: 1,
      reservedQuantity: 1,
      updatedAt: new Date(),
      product: { id: 1 } as ProductEntity,
    };

    beforeEach(async () => {
      inventoryRepository.findOne.mockResolvedValue(inv);
      result = await inventoryService.getInventoryByProductId(payload);
    });

    it('should return inventory', () => {
      expect(result).toEqual({
        id: inv.id,
        availableQuantity: inv.availableQuantity,
        reservedQuantity: inv.reservedQuantity,
        updatedAt: inv.updatedAt,
        productId: inv.product.id,
      });
    });

    it('should throw RpcException if inventory not found', async () => {
      inventoryRepository.findOne.mockResolvedValue(null);
      await expect(
        inventoryService.getInventoryByProductId(payload),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('addStock', () => {
    let result: Inventory;
    const payload: AddStockPayload = {
      productId: 1,
      quantity: 1,
    };
    const inventory = {
      id: 1,
      product: { id: payload.productId },
    } as InventoryEntity;

    beforeEach(async () => {
      inventoryRepository.findOne.mockResolvedValue(inventory);
      inventoryRepository.save.mockResolvedValue({
        ...inventory,
        availableQuantity: inventory.availableQuantity + payload.quantity,
      });
      result = await inventoryService.addStock(payload);
    });

    it('should throw RpcException when inventory not found', async () => {
      inventoryRepository.findOne.mockResolvedValue(null);
      await expect(inventoryService.addStock(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should save updated inventory in the database', () => {
      expect(inventoryRepository.save).toHaveBeenCalledWith({
        ...inventory,
        availableQuantity: inventory.availableQuantity + payload.quantity,
      });
    });

    it('should return updated inventory', () => {
      expect(result).toEqual({
        id: inventory.id,
        availableQuantity: inventory.availableQuantity + payload.quantity,
        reservedQuantity: inventory.reservedQuantity,
        updatedAt: inventory.updatedAt,
        productId: inventory.product.id,
      });
    });
  });

  describe('reserveOne', () => {
    let result: Inventory;
    const payload: AddStockPayload = {
      productId: 1,
      quantity: 1,
    };
    const inventory: Inventory = {
      id: 1,
      availableQuantity: 1,
      reservedQuantity: 100,
      updatedAt: new Date(),
      productId: 1,
    };
    let reserveManySpy: jest.SpyInstance;

    beforeEach(async () => {
      reserveManySpy = jest
        .spyOn(inventoryService, 'reserveMany')
        .mockResolvedValue([inventory]);
      result = await inventoryService.reserveOne(payload);
    });

    it('should call reserveMany', () => {
      expect(reserveManySpy).toHaveBeenCalledWith([payload]);
    });

    it('should return updated inventory', () => {
      expect(result).toEqual(inventory);
    });
  });

  describe('releaseReserveOne', () => {
    let result: Inventory;
    const payload: AddStockPayload = {
      productId: 1,
      quantity: 1,
    };
    const inventory: Inventory = {
      id: 1,
      availableQuantity: 1,
      reservedQuantity: 100,
      updatedAt: new Date(),
      productId: 1,
    };
    let releaseReserveManySpy: jest.SpyInstance;

    beforeEach(async () => {
      releaseReserveManySpy = jest
        .spyOn(inventoryService, 'releaseReserveMany')
        .mockResolvedValue([inventory]);
      result = await inventoryService.releaseReserveOne(payload);
    });

    it('should call releaseReserveMany', () => {
      expect(releaseReserveManySpy).toHaveBeenCalledWith([payload]);
    });

    it('should return updated inventory', () => {
      expect(result).toEqual(inventory);
    });
  });

  describe('commitReserveOne', () => {
    let result: Inventory;
    const payload: AddStockPayload = {
      productId: 1,
      quantity: 1,
    };
    const inventory: Inventory = {
      id: 1,
      availableQuantity: 1,
      reservedQuantity: 100,
      updatedAt: new Date(),
      productId: 1,
    };
    let commitReserveManySpy: jest.SpyInstance;

    beforeEach(async () => {
      commitReserveManySpy = jest
        .spyOn(inventoryService, 'commitReserveMany')
        .mockResolvedValue([inventory]);
      result = await inventoryService.commitReserveOne(payload);
    });

    it('should call commitReserveMany', () => {
      expect(commitReserveManySpy).toHaveBeenCalledWith([payload]);
    });

    it('should return updated inventory', () => {
      expect(result).toEqual(inventory);
    });
  });

  describe('reserveMany', () => {
    let result: Inventory[];
    const payload: AddStockPayload[] = [
      {
        productId: 1,
        quantity: 1,
      },
      {
        productId: 2,
        quantity: 100,
      },
    ];
    const inventories: InventoryEntity[] = [
      {
        id: 1,
        product: { id: 1 } as ProductEntity,
        availableQuantity: 100,
        reservedQuantity: 0,
        updatedAt: new Date(),
      },
      {
        id: 2,
        product: { id: 2 } as ProductEntity,
        availableQuantity: 100,
        reservedQuantity: 0,
        updatedAt: new Date(),
      },
    ];
    const inventoriesNotAvailable: InventoryEntity[] = [
      {
        id: 1,
        product: { id: 1 } as ProductEntity,
        availableQuantity: 100,
        reservedQuantity: 0,
        updatedAt: new Date(),
      },
      {
        id: 2,
        product: { id: 2 } as ProductEntity,
        availableQuantity: 0,
        reservedQuantity: 100,
        updatedAt: new Date(),
      },
    ];

    it('should throw RpcException when inventory not found', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue([]);
      await expect(inventoryService.reserveMany(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should throw RpcException when there is no available quantity in the inventory', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue(inventoriesNotAvailable);
      await expect(inventoryService.reserveMany(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should save updated inventories in the database', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue(inventories.map((inv) => structuredClone(inv)));

      const localInventories = inventories.map((inv) => structuredClone(inv));

      const expectedInventory1 = {
        ...localInventories[0],
        availableQuantity: 99, // 100 - 1
        reservedQuantity: 1, // 0 + 1
      };

      const expectedInventory2 = {
        ...localInventories[1],
        availableQuantity: 0, // 100 - 100
        reservedQuantity: 100, // 0 + 100
      };

      dataSourceSaveMock.mockResolvedValueOnce(expectedInventory1);
      dataSourceSaveMock.mockResolvedValueOnce(expectedInventory2);

      await inventoryService.reserveMany(payload);

      expect(dataSourceSaveMock).toHaveBeenCalledTimes(2);
      expect(dataSourceSaveMock).toHaveBeenNthCalledWith(1, expectedInventory1);
      expect(dataSourceSaveMock).toHaveBeenNthCalledWith(2, expectedInventory2);
    });

    it('should return updated inventories', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue(inventories.map((inv) => structuredClone(inv)));

      const localInventories = inventories.map((inv) => structuredClone(inv));

      const expectedInventory1 = {
        ...localInventories[0],
        availableQuantity: 99,
        reservedQuantity: 1,
      };

      const expectedInventory2 = {
        ...localInventories[1],
        availableQuantity: 0,
        reservedQuantity: 100,
      };

      dataSourceSaveMock.mockResolvedValueOnce(expectedInventory1);
      dataSourceSaveMock.mockResolvedValueOnce(expectedInventory2);

      result = await inventoryService.reserveMany(payload);

      expect(result).toEqual([
        {
          id: expectedInventory1.id,
          availableQuantity: expectedInventory1.availableQuantity,
          reservedQuantity: expectedInventory1.reservedQuantity,
          updatedAt: expectedInventory1.updatedAt,
          productId: expectedInventory1.product.id,
        },
        {
          id: expectedInventory2.id,
          availableQuantity: expectedInventory2.availableQuantity,
          reservedQuantity: expectedInventory2.reservedQuantity,
          updatedAt: expectedInventory2.updatedAt,
          productId: expectedInventory2.product.id,
        },
      ]);
    });
  });

  describe('releaseReserveMany', () => {
    let result: Inventory[];
    const payload: AddStockPayload[] = [
      {
        productId: 8,
        quantity: 5,
      },
    ];
    const inventory: InventoryEntity = {
      id: 1,
      product: { id: 8 } as ProductEntity,
      availableQuantity: 100,
      reservedQuantity: 10,
      updatedAt: new Date(),
    };

    it('should throw RpcException when inventory not found', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue([]);
      await expect(
        inventoryService.releaseReserveMany(payload),
      ).rejects.toThrow(RpcException);
    });

    it('should release reserved quantity and increase available quantity', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue([structuredClone(inventory)]);
      dataSourceSaveMock.mockResolvedValue({
        ...inventory,
        availableQuantity: inventory.availableQuantity + payload[0].quantity, // 105
        reservedQuantity: inventory.reservedQuantity - payload[0].quantity, // 5
      });
      await inventoryService.releaseReserveMany(payload);

      expect(dataSourceSaveMock).toHaveBeenCalledWith({
        ...inventory,
        availableQuantity: inventory.availableQuantity + payload[0].quantity,
        reservedQuantity: inventory.reservedQuantity - payload[0].quantity,
      });
    });

    it('should return updated inventories', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue([structuredClone(inventory)]);
      dataSourceSaveMock.mockResolvedValue({
        ...inventory,
        availableQuantity: inventory.availableQuantity + payload[0].quantity,
        reservedQuantity: inventory.reservedQuantity - payload[0].quantity,
      });
      result = await inventoryService.releaseReserveMany(payload);

      expect(result).toEqual([
        {
          id: inventory.id,
          availableQuantity: inventory.availableQuantity + payload[0].quantity,
          reservedQuantity: inventory.reservedQuantity - payload[0].quantity,
          updatedAt: inventory.updatedAt,
          productId: inventory.product.id,
        },
      ]);
    });
  });

  describe('commitReserveMany', () => {
    let result: Inventory[];
    const payload: AddStockPayload[] = [
      {
        productId: 18,
        quantity: 5,
      },
    ];
    const inventory: InventoryEntity = {
      id: 1,
      product: { id: 18 } as ProductEntity,
      availableQuantity: 100,
      reservedQuantity: 20,
      updatedAt: new Date(),
    };

    it('should throw RpcException when inventory not found', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue([]);
      await expect(inventoryService.commitReserveMany(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should commit reserved quantity', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue([structuredClone(inventory)]);
      dataSourceSaveMock.mockResolvedValue({
        ...inventory,
        reservedQuantity: inventory.reservedQuantity - payload[0].quantity, // 15
      });
      await inventoryService.commitReserveMany(payload);

      expect(dataSourceSaveMock).toHaveBeenCalledWith({
        ...inventory,
        reservedQuantity: inventory.reservedQuantity - payload[0].quantity,
      });
    });

    it('should return updated inventories', async () => {
      jest
        .spyOn(inventoryService as any, 'findInventoriesByIds')
        .mockResolvedValue([structuredClone(inventory)]);
      dataSourceSaveMock.mockResolvedValue({
        ...inventory,
        reservedQuantity: inventory.reservedQuantity - payload[0].quantity,
      });
      result = await inventoryService.commitReserveMany(payload);

      expect(result).toEqual([
        {
          id: inventory.id,
          availableQuantity: inventory.availableQuantity,
          reservedQuantity: inventory.reservedQuantity - payload[0].quantity,
          updatedAt: inventory.updatedAt,
          productId: inventory.product.id,
        },
      ]);
    });
  });
});
