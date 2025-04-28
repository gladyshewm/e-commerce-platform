import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import {
  OrderEntity,
  PaymentTransactionEntity,
  UserEntity,
} from '@app/common/database/entities';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PAYMENT_PROVIDER } from './constants';
import {
  PaymentIntent,
  PaymentProvider,
} from './payment_providers/payment-provider.interface';
import {
  ChargePaymentPayload,
  PaymentRefundPayload,
  PaymentTransaction,
} from '@app/common/contracts/payment';
import { PaymentStatus } from '@app/common/database/enums';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let paymentRepository: jest.Mocked<Repository<PaymentTransactionEntity>>;
  let paymentProvider: jest.Mocked<PaymentProvider>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(PaymentTransactionEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(async (entity) => entity as PaymentTransactionEntity),
            findOne: jest.fn(),
          },
        },
        {
          provide: PAYMENT_PROVIDER,
          useValue: {
            createPaymentIntent: jest.fn(),
            refundPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    paymentService = app.get<PaymentService>(PaymentService);
    paymentRepository = app.get<
      jest.Mocked<Repository<PaymentTransactionEntity>>
    >(getRepositoryToken(PaymentTransactionEntity));
    paymentProvider = app.get<jest.Mocked<PaymentProvider>>(PAYMENT_PROVIDER);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(paymentService).toBeDefined();
    });
  });

  describe('chargePayment', () => {
    let result: PaymentTransaction;
    const payload: ChargePaymentPayload = {
      orderId: 1,
      userId: 1,
      amount: 100,
      currency: 'USD',
    };
    const paymentIntent: PaymentIntent = {
      id: 'fake_intent_id',
      amount: payload.amount,
      currency: payload.currency,
      metadata: {
        orderId: payload.orderId,
        userId: payload.userId,
      },
    };
    const createPaymentEntity = (): PaymentTransactionEntity => ({
      id: 1,
      amount: payload.amount,
      status: PaymentStatus.PENDING,
      currency: payload.currency,
      externalPaymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: { id: payload.orderId } as OrderEntity,
      user: { id: payload.userId } as UserEntity,
    });
    let transactionEntity: PaymentTransactionEntity;

    beforeEach(async () => {
      paymentProvider.createPaymentIntent.mockResolvedValue(paymentIntent);
      paymentRepository.create.mockImplementation(() => {
        transactionEntity = createPaymentEntity();
        return transactionEntity;
      });

      result = await paymentService.chargePayment(payload);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create payment intent', () => {
      expect(paymentProvider.createPaymentIntent).toHaveBeenCalledWith({
        amount: payload.amount,
        currency: payload.currency,
        metadata: {
          orderId: payload.orderId,
          userId: payload.userId,
        },
      });
    });

    it('should save transaction twice (create and update status)', () => {
      expect(paymentRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should save transaction with succeeded status', () => {
      expect(paymentRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: PaymentStatus.SUCCEEDED,
        }),
      );
    });

    it('should return successful payment transaction', () => {
      expect(result).toEqual({
        id: transactionEntity.id,
        amount: transactionEntity.amount,
        status: PaymentStatus.SUCCEEDED,
        currency: transactionEntity.currency,
        externalPaymentId: paymentIntent.id,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        orderId: transactionEntity.order.id,
        userId: transactionEntity.user.id,
      });
    });

    describe('when payment provider fails', () => {
      beforeEach(async () => {
        paymentProvider.createPaymentIntent.mockRejectedValue(
          new Error('Payment provider failed'),
        );
        result = await paymentService.chargePayment(payload);
      });

      it('should save transaction with failed status', () => {
        expect(paymentRepository.save).toHaveBeenLastCalledWith(
          expect.objectContaining({
            status: PaymentStatus.FAILED,
          }),
        );
      });

      it('should return failed payment transaction', async () => {
        expect(result).toEqual({
          id: transactionEntity.id,
          amount: transactionEntity.amount,
          status: PaymentStatus.FAILED,
          currency: transactionEntity.currency,
          externalPaymentId: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          orderId: transactionEntity.order.id,
          userId: transactionEntity.user.id,
        });
      });
    });
  });

  describe('refundPayment', () => {
    let result: PaymentTransaction;
    const payload: PaymentRefundPayload = { orderId: 1 };
    const createPaymentEntity = (
      status: PaymentStatus,
    ): PaymentTransactionEntity => ({
      id: 1,
      amount: 100,
      status,
      currency: 'USD',
      externalPaymentId: 'fake_intent_id',
      createdAt: new Date(),
      updatedAt: new Date(),
      order: { id: payload.orderId } as OrderEntity,
      user: { id: 1 } as UserEntity,
    });
    let transactionEntity: PaymentTransactionEntity;

    beforeEach(async () => {
      transactionEntity = createPaymentEntity(PaymentStatus.SUCCEEDED);
      paymentRepository.findOne.mockResolvedValue(transactionEntity);

      result = await paymentService.refundPayment(payload);
    });

    it('should find transaction entity', () => {
      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        where: { order: { id: payload.orderId } },
      });
    });

    it('should throw error if transaction not found', async () => {
      paymentRepository.findOne.mockResolvedValue(null);
      await expect(paymentService.refundPayment(payload)).rejects.toThrow(
        Error,
      );
    });

    it('should throw error if transaction status is not succeeded', async () => {
      paymentRepository.findOne.mockResolvedValue(
        createPaymentEntity(PaymentStatus.PENDING),
      );
      await expect(paymentService.refundPayment(payload)).rejects.toThrow(
        Error,
      );
    });

    it('should call payment provider', () => {
      expect(paymentProvider.refundPayment).toHaveBeenCalledWith(
        createPaymentEntity(PaymentStatus.SUCCEEDED).externalPaymentId,
      );
    });

    it('should throw error if payment provider fails', async () => {
      paymentProvider.refundPayment.mockRejectedValue(new Error('Error'));
      await expect(paymentService.refundPayment(payload)).rejects.toThrow(
        Error,
      );
    });

    it('should save refunded transaction in database', () => {
      expect(paymentRepository.save).toHaveBeenCalledWith({
        ...transactionEntity,
        status: PaymentStatus.REFUNDED,
      });
    });

    it('should return successful payment transaction', () => {
      expect(result).toEqual({
        id: transactionEntity.id,
        amount: transactionEntity.amount,
        status: PaymentStatus.REFUNDED,
        currency: transactionEntity.currency,
        externalPaymentId: transactionEntity.externalPaymentId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        orderId: transactionEntity.order.id,
        userId: transactionEntity.user.id,
      });
    });
  });
});
