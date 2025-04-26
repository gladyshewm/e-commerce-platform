import { Order, OrderItem } from '@app/common/contracts/order';
import { OrderStatus } from '@app/common/database/enums';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto implements OrderItem {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 15 })
  quantity: number;

  @ApiProperty({ example: 22000 })
  priceAtPurchase: number;

  @ApiProperty({ example: 1 })
  orderId: number;

  @ApiProperty({ example: 1 })
  productId: number;
}

export class OrderDto implements Order {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 15000 })
  totalAmount: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PAID })
  status: OrderStatus;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 2 })
  userId: number;

  @ApiProperty({ type: () => [OrderItemDto] })
  items: OrderItemDto[];
}
