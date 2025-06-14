import { Controller } from '@nestjs/common';
import { BaseRpcController, RmqService } from '@app/rmq';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from './services';
import { NotifyOrderDto } from './dto/notification-notify-order.dto';
import { SendEmailActivationLinkDto } from './dto/notification-send-email-activation-link.dto';
import {
  DeliveryEvents,
  OrderEvents,
  UserCommands,
} from '@app/common/messaging';

@Controller()
export class NotificationController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly notificationService: NotificationService,
  ) {
    super(rmqService);
  }

  @EventPattern(UserCommands.SendEmailActivationLink)
  async handleSendEmailActivationLink(
    @Payload() payload: SendEmailActivationLinkDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.sendEmailActivationLink(payload),
    );
  }

  @EventPattern(OrderEvents.Created)
  async handleOrderCreated(
    @Payload() payload: NotifyOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserOrderCreated(payload),
    );
  }

  @EventPattern(DeliveryEvents.Scheduled)
  async handleDeliveryScheduled(
    @Payload() payload: NotifyOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserDeliveryScheduled(payload),
    );
  }

  @EventPattern(DeliveryEvents.Started)
  async handleDeliveryStarted(
    @Payload() payload: NotifyOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserDeliveryStarted(payload),
    );
  }

  @EventPattern(DeliveryEvents.Completed)
  async handleDeliveryCompleted(
    @Payload() payload: NotifyOrderDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.notificationService.notifyUserDeliveryCompleted(payload),
    );
  }
}
