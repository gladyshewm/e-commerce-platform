import { OrderStatus } from '../../database/enums';

export interface Order {
  id: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  userId: number;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  quantity: number;
  priceAtPurchase: number;
  orderId: number;
  productId: number;
}

export interface OrderWithoutItems extends Omit<Order, 'items'> {}
