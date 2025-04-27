import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RmqService } from '@app/rmq';
import { RmqContext } from '@nestjs/microservices';
import { ChargePaymentDto } from './dto/payment-charge.dto';
import { PaymentTransaction } from '@app/common/contracts/payment';
import { RefundPaymentDto } from './dto/payment-refund.dto';

jest.mock('./payment.service');

describe('PaymentController', () => {
  let paymentController: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;
  let rmqService: jest.Mocked<RmqService>;
  const context = {} as RmqContext;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        PaymentService,
        {
          provide: RmqService,
          useValue: {
            ack: jest.fn(),
          },
        },
      ],
    }).compile();

    paymentController = app.get<PaymentController>(PaymentController);
    paymentService = app.get<jest.Mocked<PaymentService>>(PaymentService);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(paymentController).toBeDefined();
    });
  });

  describe('chargePayment', () => {
    let result: PaymentTransaction;
    const paymentTransaction = {
      id: 1,
      amount: 100,
      currency: 'USD',
      orderId: 1,
      userId: 1,
    } as PaymentTransaction;
    const payload: ChargePaymentDto = {
      orderId: 1,
      userId: 1,
      amount: 100,
      currency: 'USD',
    };

    beforeEach(async () => {
      paymentService.chargePayment.mockResolvedValue(paymentTransaction);
      result = await paymentController.chargePayment(payload, context);
    });

    it('should call paymentService.chargePayment', () => {
      expect(paymentService.chargePayment).toHaveBeenCalledWith(payload);
      expect(paymentService.chargePayment).toHaveBeenCalledTimes(1);
    });

    it('should return payment transaction', () => {
      expect(result).toEqual(paymentTransaction);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(context);
    });
  });

  describe('refundPayment', () => {
    let result: PaymentTransaction;
    const paymentTransaction = {
      id: 1,
      amount: 100,
      currency: 'USD',
      orderId: 1,
      userId: 1,
    } as PaymentTransaction;
    const payload: RefundPaymentDto = {
      orderId: 1,
    };

    beforeEach(async () => {
      paymentService.refundPayment.mockResolvedValue(paymentTransaction);
      result = await paymentController.refundPayment(payload, context);
    });

    it('should call paymentService.refundPayment', () => {
      expect(paymentService.refundPayment).toHaveBeenCalledWith(payload);
      expect(paymentService.refundPayment).toHaveBeenCalledTimes(1);
    });

    it('should return payment transaction', () => {
      expect(result).toEqual(paymentTransaction);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(context);
    });
  });
});
