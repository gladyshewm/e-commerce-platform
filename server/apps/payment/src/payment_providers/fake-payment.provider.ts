import { Injectable, Logger } from '@nestjs/common';
import { PaymentIntent, PaymentProvider } from './payment-provider.interface';

@Injectable()
export class FakePaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(FakePaymentProvider.name);

  async createPaymentIntent(
    data: Omit<PaymentIntent, 'id'>,
  ): Promise<PaymentIntent> {
    return {
      id: `fake_${Math.random().toString(36).substring(2, 10)}`,
      amount: data.amount,
      currency: data.currency,
      metadata: data.metadata,
    };
  }

  async refundPayment(externalPaymentId: string): Promise<void> {
    this.logger.log(`Refunding payment with ID ${externalPaymentId}`);
  }
}
