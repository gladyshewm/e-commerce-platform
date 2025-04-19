export interface Inventory {
  id: number;
  availableQuantity: number;
  reservedQuantity: number;
  updatedAt: Date;
  productId: number;
}
