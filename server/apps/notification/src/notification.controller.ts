import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { BaseRpcController, RmqService } from '@app/rmq';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotifyUserDto } from './dto/notification-notify-user.dto';

@Controller()
export class NotificationController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly notificationService: NotificationService,
  ) {
    super(rmqService);
  }

  @EventPattern('order_created')
  async handleOrderCreated(
    @Payload() payload: NotifyUserDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserOrderCreated(payload),
    );
  }

  @EventPattern('delivery_scheduled')
  async handleDeliveryScheduled(
    @Payload() payload: NotifyUserDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserDeliveryScheduled(payload),
    );
  }

  @EventPattern('delivery_started')
  async handleDeliveryStarted(
    @Payload() payload: NotifyUserDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserDeliveryStarted(payload),
    );
  }

  @EventPattern('delivery_completed')
  async handleDeliveryCompleted(
    @Payload() payload: NotifyUserDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserDeliveryCompleted(payload),
    );
  }
}
