import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, OrderCreatedPayload } from '@app/common/contracts/delivery';
import { DeliveryEntity } from '@app/common/database/entities';
import { DeliveryStatus } from '@app/common/database/enums';
import { NOTIFICATION_SERVICE, ORDER_SERVICE } from '@app/common/constants';
import { DeliveryEvents, OrderEvents } from '@app/common/messaging';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(DeliveryEntity)
    private readonly deliveryRepository: Repository<DeliveryEntity>,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationServiceClient: ClientProxy,
    @Inject(ORDER_SERVICE)
    private readonly orderServiceClient: ClientProxy,
  ) {}

  async scheduleDelivery(payload: OrderCreatedPayload): Promise<void> {
    const existing = await this.deliveryRepository.findOne({
      where: { order: { id: payload.orderId } },
    });

    if (existing) {
      this.logger.log(
        `Delivery already scheduled for order with ID ${payload.orderId}`,
      );
      return;
    }

    const delivery = this.deliveryRepository.create({
      status: DeliveryStatus.SCHEDULED,
      scheduledAt: new Date(),
      order: { id: payload.orderId },
    });

    await this.deliveryRepository.save(delivery);

    this.logger.log(`Delivery scheduled for order with ID ${payload.orderId}`);

    this.notificationServiceClient
      .emit(DeliveryEvents.Scheduled, {
        userId: payload.userId,
        orderId: payload.orderId,
      })
      .subscribe();

    // FIXME: fake delay
    setTimeout(
      () => this.startDelivery(payload.userId, payload.orderId),
      5_000,
    );
  }

  async startDelivery(userId: number, orderId: number) {
    await this.updateDeliveryStatus(orderId, DeliveryStatus.IN_TRANSIT);

    this.logger.log(`Delivery for order with ID ${orderId} started`);

    this.notificationServiceClient
      .emit(DeliveryEvents.Started, {
        userId,
        orderId,
      })
      .subscribe();

    this.orderServiceClient.emit(OrderEvents.Shipped, { orderId }).subscribe();

    //FIXME: fake delay
    setTimeout(() => this.completeDelivery(userId, orderId), 5_000);
  }

  async completeDelivery(userId: number, orderId: number) {
    const delivery = await this.deliveryRepository.findOne({
      where: { order: { id: orderId } },
    });

    if (!delivery) {
      this.logger.error(`Delivery for order with ID ${orderId} not found`);
      throw new RpcException({
        message: `Delivery for order with ID ${orderId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    if (delivery.status !== DeliveryStatus.IN_TRANSIT) {
      this.logger.error(
        `Delivery for order with ID ${orderId} is not in transit`,
      );
      throw new RpcException({
        message: `Delivery for order with ID ${orderId} is not in transit`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    // delivery.status = DeliveryStatus.DELIVERED;
    delivery.deliveredAt = new Date();
    await this.deliveryRepository.save(delivery);

    await this.updateDeliveryStatus(orderId, DeliveryStatus.DELIVERED);

    this.logger.log(`Delivery for order with ID ${orderId} completed`);

    this.notificationServiceClient
      .emit(DeliveryEvents.Completed, {
        userId,
        orderId,
      })
      .subscribe();

    this.orderServiceClient
      .emit(OrderEvents.Delivered, { orderId })
      .subscribe();
  }

  private async updateDeliveryStatus(
    orderId: number,
    status: DeliveryStatus,
  ): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { order: { id: orderId } },
    });

    if (!delivery) {
      this.logger.error(`Delivery for order with ID ${orderId} not found`);
      throw new RpcException({
        message: `Delivery for order with ID ${orderId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const existingStatus = delivery.status;

    if (existingStatus === status) {
      this.logger.log(
        `Delivery for order with ID ${orderId} already has status ${status}`,
      );
      return {
        id: delivery.id,
        status: delivery.status,
        scheduledAt: delivery.scheduledAt,
        deliveredAt: delivery.scheduledAt,
        orderId: delivery.order.id,
      };
    }

    delivery.status = status;
    const saved = await this.deliveryRepository.save(delivery);

    this.logger.log(
      `Delivery for order with ID ${orderId} status updated from ${existingStatus.toUpperCase()} to ${status.toUpperCase()}`,
    );

    return {
      id: saved.id,
      status: saved.status,
      scheduledAt: saved.scheduledAt,
      deliveredAt: saved.deliveredAt,
      orderId,
    };
  }
}
