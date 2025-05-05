import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { RmqService } from '@app/rmq';
import { RmqContext } from '@nestjs/microservices';
import { ScheduleDeliveryDto } from './dto/schedule-delivery.dto';

jest.mock('./delivery.service');

describe('DeliveryController', () => {
  let deliveryController: DeliveryController;
  let deliveryService: jest.Mocked<DeliveryService>;
  let rmqService: jest.Mocked<RmqService>;
  const ctx = {} as RmqContext;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryController],
      providers: [
        DeliveryService,
        {
          provide: RmqService,
          useValue: {
            ack: jest.fn(),
          },
        },
      ],
    }).compile();

    deliveryController = app.get<DeliveryController>(DeliveryController);
    deliveryService = app.get<jest.Mocked<DeliveryService>>(DeliveryService);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(deliveryController).toBeDefined();
    });
  });

  describe('handleOrderCreated', () => {
    const payload: ScheduleDeliveryDto = { userId: 1, orderId: 55 };

    beforeEach(async () => {
      await deliveryController.handleOrderCreated(payload, ctx);
    });

    it('should call deliveryService', () => {
      expect(deliveryService.scheduleDelivery).toHaveBeenCalledWith(payload);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });
});
