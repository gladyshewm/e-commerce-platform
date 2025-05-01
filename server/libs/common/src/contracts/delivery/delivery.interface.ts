import { DeliveryStatus } from '../../database/enums';

export interface Delivery {
  id: number;
  status: DeliveryStatus;
  scheduledAt: Date;
  deliveredAt?: Date;
  orderId: number;
}
