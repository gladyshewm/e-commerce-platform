import { Order } from '@app/common/contracts/order';

export interface OrderSagaContext {
  order: Order;
  userId: number;
}
