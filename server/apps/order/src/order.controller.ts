import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import { OrderOrchestrator } from './saga/order.orchestrator';
import { CreateOrderDto } from './dto/order-create.dto';

@Controller()
export class OrderController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
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
}
