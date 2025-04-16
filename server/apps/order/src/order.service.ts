import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderPayload } from '@app/common/contracts/order';
import { DataSource } from 'typeorm';
import { OrderEntity, OrderItemEntity } from '@app/common/database/entities';
import { OrderStatus } from '@app/common/database/enums';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly dataSource: DataSource) {}

  async createOrder(payload: CreateOrderPayload) {
    this.logger.debug('create order');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.save(OrderEntity, {
        user: { id: payload.userId },
        status: OrderStatus.PENDING,
        totalAmount: payload.totalAmount,
      });

      // const product = await this.productClient
      //   .send('get_product_by_id', item.productId)
      //   .toPromise();
      // const priceAtPurchase = product.price;

      await queryRunner.manager.save(
        OrderItemEntity,
        payload.items.map((item) => ({
          order: { id: order.id },
          product: { id: item.productId },
          quantity: item.quantity,
          priceAtPurchase: 228, // FIXME:
        })),
      );

      await queryRunner.commitTransaction();

      return { success: true, orderId: order.id };
    } catch (error) {
      this.logger.debug('rollback');
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
