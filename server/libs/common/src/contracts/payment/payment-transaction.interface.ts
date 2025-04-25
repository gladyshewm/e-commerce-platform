import { PaymentStatus } from '../../database/enums';

export interface PaymentTransaction {
  id: number;
  amount: number;
  status: PaymentStatus;
  currency: string;
  externalPaymentId: string;
  createdAt: Date;
  updatedAt: Date;
  orderId: number;
  userId: number;
}
