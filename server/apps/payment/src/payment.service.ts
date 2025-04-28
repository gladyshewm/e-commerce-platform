import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ChargePaymentPayload,
  PaymentRefundPayload,
  PaymentTransaction,
} from '@app/common/contracts/payment';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentTransactionEntity } from '@app/common/database/entities';
import { Repository } from 'typeorm';
import { PaymentStatus } from '@app/common/database/enums';
import { PaymentProvider } from './payment_providers/payment-provider.interface';
import { PAYMENT_PROVIDER } from './constants';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentTransactionEntity)
    private readonly paymentRepository: Repository<PaymentTransactionEntity>,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  async chargePayment(
    payload: ChargePaymentPayload,
  ): Promise<PaymentTransaction> {
    const transaction = this.paymentRepository.create({
      amount: payload.amount,
      currency: payload.currency,
      status: PaymentStatus.PENDING,
      order: { id: payload.orderId },
      user: { id: payload.userId },
    });

    let saved = await this.paymentRepository.save(transaction);

    try {
      const external = await this.paymentProvider.createPaymentIntent({
        amount: payload.amount,
        currency: payload.currency,
        metadata: {
          orderId: payload.orderId,
          userId: payload.userId,
        },
      });
      saved.externalPaymentId = external.id;
      saved.status = PaymentStatus.SUCCEEDED;
    } catch (error) {
      this.logger.error(
        `Payment provider failed for orderId ${payload.orderId}: ${error.message}`,
      );
      saved.status = PaymentStatus.FAILED;
    }

    saved = await this.paymentRepository.save(saved);

    this.logger.log(`Payment for orderId ${payload.orderId} charged`);

    return {
      id: saved.id,
      amount: saved.amount,
      status: saved.status,
      currency: saved.currency,
      externalPaymentId: saved.externalPaymentId,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      orderId: saved.order.id,
      userId: saved.user.id,
    };
  }

  async refundPayment(
    payload: PaymentRefundPayload,
  ): Promise<PaymentTransaction> {
    const transaction = await this.paymentRepository.findOne({
      where: { order: { id: payload.orderId } },
    });

    if (!transaction) {
      this.logger.error(`Transaction not found for orderId ${payload.orderId}`);
      throw new RpcException({
        message: `Transaction not found for orderId ${payload.orderId}`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    if (transaction.status !== PaymentStatus.SUCCEEDED) {
      this.logger.error(
        `Cannot refund an uncompleted payment for orderId ${payload.orderId}`,
      );
      throw new RpcException({
        message: `Cannot refund an uncompleted payment for orderId ${payload.orderId}`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    try {
      await this.paymentProvider.refundPayment(transaction.externalPaymentId);
    } catch (error) {
      this.logger.error(
        `Failed to refund payment for orderId ${payload.orderId}: ${error.message}`,
      );
      throw new RpcException({
        message: 'Refund failed',
        statusCode: HttpStatus.BAD_GATEWAY,
      });
    }

    transaction.status = PaymentStatus.REFUNDED;
    const saved = await this.paymentRepository.save(transaction);
    this.logger.log(`Payment for orderId ${payload.orderId} refunded`);

    return {
      id: saved.id,
      amount: saved.amount,
      status: saved.status,
      currency: saved.currency,
      externalPaymentId: saved.externalPaymentId,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      orderId: saved.order.id,
      userId: saved.user.id,
    };
  }
}
