export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  metadata: Record<string, any>;
}

export interface PaymentProvider {
  createPaymentIntent(data: Omit<PaymentIntent, 'id'>): Promise<PaymentIntent>;
  refundPayment(externalPaymentId: string): Promise<void>;
}
