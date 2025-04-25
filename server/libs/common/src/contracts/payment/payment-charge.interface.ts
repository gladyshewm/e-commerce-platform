export interface ChargePaymentPayload {
  orderId: number;
  userId: number;
  amount: number;
  currency: string;
}
