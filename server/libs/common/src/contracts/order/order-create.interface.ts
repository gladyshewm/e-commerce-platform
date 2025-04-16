export interface CreateOrderPayload {
  userId: number;
  items: {
    productId: number;
    quantity: number;
  }[];
  totalAmount: number;
}
