import { Order } from '@app/common/contracts/order';
import { OrderStatus } from '@app/common/database/enums';

export interface OrderSagaContext {
  order: Order;
  previousStatus?: OrderStatus;
}
