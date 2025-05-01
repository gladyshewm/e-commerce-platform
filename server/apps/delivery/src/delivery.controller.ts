import { Controller } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import { ScheduleDeliveryDto } from './dto/schedule-delivery.dto';

@Controller()
export class DeliveryController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly deliveryService: DeliveryService,
  ) {
    super(rmqService);
  }

  @EventPattern('order_created')
  async handleOrderCreated(
    @Payload() payload: ScheduleDeliveryDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.deliveryService.scheduleDelivery(payload),
    );
  }
}
