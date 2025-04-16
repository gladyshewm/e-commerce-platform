import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import { CreateOrderPayload } from '@app/common/contracts/order';

@Controller()
export class OrderController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly orderService: OrderService,
  ) {
    super(rmqService);
  }

  @MessagePattern('create_order')
  async createOrder(
    @Payload() payload: CreateOrderPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.orderService.createOrder(payload),
    );
  }
}
