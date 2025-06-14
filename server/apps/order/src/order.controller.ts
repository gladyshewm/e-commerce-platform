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
import { OrderCommands, OrderEvents } from '@app/common/messaging';
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

  @MessagePattern(OrderCommands.Create)
  async createOrder(
    @Payload() payload: CreateOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.orderOrchestrator.createOrder(payload),
    );
  }

  @EventPattern(OrderEvents.Shipped)
  async onShipped(@Payload() payload: OrderShippedDto, @Ctx() ctx: RmqContext) {
    await this.handleMessage(ctx, () =>
      this.orderService.updateOrderStatus(payload.orderId, OrderStatus.SHIPPED),
    );
  }

  @EventPattern(OrderEvents.Delivered)
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
