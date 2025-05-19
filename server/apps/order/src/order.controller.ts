import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import { OrderStatus } from '@app/common/database/enums';
import { OrderOrchestrator } from './saga/order.orchestrator';
import { CreateOrderDto } from './dto/order-create.dto';
import { OrderService } from './order.service';
import { OrderShippedDto } from './dto/order-shipped.dto';

@Controller()
export class OrderController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly orderService: OrderService,
    private readonly orderOrchestrator: OrderOrchestrator,
  ) {
    super(rmqService);
  }

  @MessagePattern('create_order')
  async createOrder(
    @Payload() payload: CreateOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.orderOrchestrator.createOrder(payload),
    );
  }

  @EventPattern('order_shipped')
  async onShipped(@Payload() payload: OrderShippedDto, @Ctx() ctx: RmqContext) {
    await this.handleMessage(ctx, () =>
      this.orderService.updateOrderStatus(payload.orderId, OrderStatus.SHIPPED),
    );
  }

  @EventPattern('order_delivered')
  async onDelivered(
    @Payload() payload: OrderShippedDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.orderService.updateOrderStatus(
        payload.orderId,
        OrderStatus.DELIVERED,
      ),
    );
  }

  // TODO: cancel_order
}
