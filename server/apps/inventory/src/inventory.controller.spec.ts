import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { RmqService } from '@app/rmq';

jest.mock('./inventory.service');

describe('InventoryController', () => {
  let inventoryController: InventoryController;
  let rmqService: jest.Mocked<RmqService>;

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
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(inventoryController).toBeDefined();
    });
  });
});
