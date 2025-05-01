import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Delivery, OrderCreatedPayload } from '@app/common/contracts/delivery';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryEntity } from '@app/common/database/entities';
import { Repository } from 'typeorm';
import { DeliveryStatus } from '@app/common/database/enums';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(DeliveryEntity)
    private readonly deliveryRepository: Repository<DeliveryEntity>,
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

    // TODO: notify emit delivery_scheduled

    // FIXME: fake delay
    setTimeout(() => this.startDelivery(payload.orderId), 5_000);
  }

  async startDelivery(orderId: number) {
    await this.updateDeliveryStatus(orderId, DeliveryStatus.IN_TRANSIT);

    this.logger.log(`Delivery for order with ID ${orderId} started`);

    // TODO: notify emit delivery_started

    //FIXME: fake delay
    setTimeout(() => this.completeDelivery(orderId), 5_000);
  }

  async completeDelivery(orderId: number) {
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

    // TODO: notify emit delivery_completed
  }

  async updateDeliveryStatus(
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
