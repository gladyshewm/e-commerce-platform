import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateOrderPayload,
  Order,
  OrderWithoutItems,
} from '@app/common/contracts/order';
import { DataSource, Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity } from '@app/common/database/entities';
import { OrderStatus } from '@app/common/database/enums';
import { PRODUCT_SERVICE } from '@app/common/constants';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import { ProductWithCategory } from '@app/common/contracts/product';
import { ProductCommands } from '@app/common/messaging';

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

  private mapToOrderDto(order: OrderEntity): Order {
    return {
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      userId: order.user.id,
      items:
        order.items?.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          priceAtPurchase: i.priceAtPurchase,
          orderId: order.id,
          productId: i.product.id,
        })) ?? [],
    };
  }

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productIds = payload.items.map((i) => i.productId);
      const products = await lastValueFrom<ProductWithCategory[]>(
        this.productServiceClient
          .send(ProductCommands.GetAll, { productIds })
          .pipe(
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
            message: `Product with ID ${item.productId} not found`,
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
      return this.mapToOrderDto({ ...order, items: savedItems });
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
      this.logger.error(`Order with ID ${orderId} not found`);
      throw new RpcException({
        message: `Order with id ${orderId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    if (order.status === OrderStatus.CANCELLED) {
      this.logger.warn(`Order with ID ${orderId} already cancelled`);
      return this.mapToOrderDto(order);
    }

    order.status = OrderStatus.CANCELLED;
    const saved = await this.orderRepository.save(order);

    this.logger.log(`Order with ID ${orderId} cancelled`);
    return this.mapToOrderDto(saved);
  }

  async findOrder(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      this.logger.error(`Order with ID ${orderId} not found`);
      throw new RpcException({
        message: `Order with ID ${orderId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return this.mapToOrderDto(order);
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
      this.logger.error(`Order with ID ${orderId} not found`);
      throw new RpcException({
        message: `Order with ID ${orderId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const existingStatus = order.status;

    if (existingStatus === status) {
      this.logger.log(`Order with ID ${orderId} already has status ${status}`);
      return this.mapToOrderDto(order);
    }

    order.status = status;
    const saved = await this.orderRepository.save(order);

    this.logger.log(
      `Order with ID ${orderId} status updated from ${existingStatus.toUpperCase()} to ${status.toUpperCase()}`,
    );
    return this.mapToOrderDto(saved);
  }
}
