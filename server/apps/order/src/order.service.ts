import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderWithoutItems,
} from '@app/common/contracts/order';
import { DataSource, Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity } from '@app/common/database/entities';
import { OrderStatus } from '@app/common/database/enums';
import { PRODUCT_SERVICE } from '@app/common/constants';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import { ProductWithCategory } from '@app/common/contracts/product';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly orderRepository: Repository<OrderEntity>;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(PRODUCT_SERVICE)
    private readonly productServiceClient: ClientProxy,
  ) {
    this.orderRepository = this.dataSource.getRepository(OrderEntity);
  }

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productIds = payload.items.map((i) => i.productId);
      const products = await lastValueFrom<ProductWithCategory[]>(
        this.productServiceClient.send('get_products', { productIds }).pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              statusCode: error.statusCode,
            });
          }),
        ),
      );
      const productMap = new Map(products.map((p) => [p.id, p]));

      const items = payload.items.map((item) => {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new RpcException({
            message: `Product with id ${item.productId} not found`,
            statusCode: HttpStatus.NOT_FOUND,
          });
        }

        return {
          product: { id: product.id },
          quantity: item.quantity,
          priceAtPurchase: product.price,
        };
      });

      const totalAmount = items.reduce(
        (acc, item) => acc + item.priceAtPurchase * item.quantity,
        0,
      );

      const order = await queryRunner.manager.save(OrderEntity, {
        user: { id: payload.userId },
        status: OrderStatus.PENDING,
        totalAmount,
      });

      const savedItems = await queryRunner.manager.save(
        OrderItemEntity,
        items.map((item) => ({
          ...item,
          order: { id: order.id },
        })),
      );

      await queryRunner.commitTransaction();
      return {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        userId: order.user.id,
        items: savedItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
          orderId: item.order.id,
          productId: item.product.id,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to create order: ${error.message}`,
        error.stack,
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelOrder(orderId: number): Promise<OrderWithoutItems> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      this.logger.error(`Order with id ${orderId} not found`);
      throw new RpcException({
        message: `Order with id ${orderId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    order.status = OrderStatus.CANCELLED;
    const saved = await this.orderRepository.save(order);

    this.logger.log(`Order with id ${orderId} cancelled`);

    return {
      id: saved.id,
      totalAmount: saved.totalAmount,
      status: saved.status,
      createdAt: saved.createdAt,
      userId: saved.user.id,
    };
  }

  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      this.logger.error(`Order with id ${orderId} not found`);
      throw new RpcException({
        message: `Order with id ${orderId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const existingStatus = order.status;
    const items: OrderItem[] = order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      orderId,
      productId: item.product.id,
    }));

    if (existingStatus === status) {
      this.logger.log(`Order with id ${orderId} already has status ${status}`);
      return {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        userId: order.user.id,
        items,
      };
    }

    order.status = status;
    const saved = await this.orderRepository.save(order);

    this.logger.log(
      `Order with id ${orderId} status updated from ${existingStatus.toUpperCase()} to ${status.toUpperCase()}`,
    );

    return {
      id: saved.id,
      totalAmount: saved.totalAmount,
      status: saved.status,
      createdAt: saved.createdAt,
      userId: saved.user.id,
      items,
    };
  }
}
