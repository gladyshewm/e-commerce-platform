import { Controller } from '@nestjs/common';
import { BaseRpcController, RmqService } from '@app/rmq';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from './services';
import { NotifyOrderDto } from './dto/notification-notify-order.dto';
import { SendEmailActivationLinkDto } from './dto/notification-send-email-activation-link.dto';

@Controller()
export class NotificationController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly notificationService: NotificationService,
  ) {
    super(rmqService);
  }

  @EventPattern('send_email_activation_link')
  async handleSendEmailActivationLink(
    @Payload() payload: SendEmailActivationLinkDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.sendEmailActivationLink(payload),
    );
  }

  @EventPattern('order_created')
  async handleOrderCreated(
    @Payload() payload: NotifyOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserOrderCreated(payload),
    );
  }

  @EventPattern('delivery_scheduled')
  async handleDeliveryScheduled(
    @Payload() payload: NotifyOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserDeliveryScheduled(payload),
    );
  }

  @EventPattern('delivery_started')
  async handleDeliveryStarted(
    @Payload() payload: NotifyOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserDeliveryStarted(payload),
    );
  }

  @EventPattern('delivery_completed')
  async handleDeliveryCompleted(
    @Payload() payload: NotifyOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserDeliveryCompleted(payload),
    );
  }
}
