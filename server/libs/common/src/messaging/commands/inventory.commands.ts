export enum InventoryCommands {
  GetAll = 'inventory.get-all',
  GetByProductId = 'inventory.get-by-product-id',
  AddStock = 'inventory.add-stock',
  Reserve = 'inventory.reserve',
  ReserveMany = 'inventory.reserve-many',
  CommitReserve = 'inventory.commit-reserve',
  CommitReserveMany = 'inventory.commit-reserve-many',
  ReleaseReserve = 'inventory.release-reserve',
  ReleaseReserveMany = 'inventory.release-reserve-many',
}
