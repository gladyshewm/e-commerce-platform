import { Injectable } from '@nestjs/common';
import { NotificationContentService } from './notification-content.service';
import { NotificationProcessorService } from './notification-processor.service';
import { NotificationType } from '@app/common/database/enums';
import {
  OrderCreatedPayload,
  SendEmailActivationLinkPayload,
} from '@app/common/contracts/notification';

@Injectable()
export class NotificationService {
  constructor(
    private readonly processor: NotificationProcessorService,
    private readonly contentService: NotificationContentService,
  ) {}

  async sendEmailActivationLink(
    payload: SendEmailActivationLinkPayload,
  ): Promise<void> {
    const { userId, username, token } = payload;
    const { subject, content } = this.contentService.buildEmailActivation(
      username,
      token,
    );

    await this.processor.process(
      NotificationType.EMAIL,
      userId,
      subject,
      content,
    );

    // TODO:
    // const channels = [
    //   NotificationType.EMAIL,
    //   NotificationType.SMS,
    //   NotificationType.PUSH,
    // ];
    // for (const channel of channels) {
    //   await this.processNotification(channel, userId, subject, content);
    // }
    // или ??
    // await Promise.allSettled(
    //   channels.map((channel) =>
    //     this.processNotification(channel, userId, subject, content),
    //   ),
    // );
  }

  async notifyUserOrderCreated(payload: OrderCreatedPayload): Promise<void> {
    const { userId, orderId } = payload;
    const { subject, content } = this.contentService.buildOrderCreated(orderId);

    await this.processor.process(
      NotificationType.EMAIL,
      userId,
      subject,
      content,
    );
  }

  async notifyUserDeliveryScheduled(
    payload: OrderCreatedPayload,
  ): Promise<void> {
    const { userId, orderId } = payload;
    const { subject, content } =
      this.contentService.buildDeliveryScheduled(orderId);

    await this.processor.process(
      NotificationType.EMAIL,
      userId,
      subject,
      content,
    );
  }

  async notifyUserDeliveryStarted(payload: OrderCreatedPayload): Promise<void> {
    const { userId, orderId } = payload;
    const { subject, content } =
      this.contentService.buildDeliveryStarted(orderId);

    await this.processor.process(
      NotificationType.EMAIL,
      userId,
      subject,
      content,
    );
  }

  async notifyUserDeliveryCompleted(
    payload: OrderCreatedPayload,
  ): Promise<void> {
    const { userId, orderId } = payload;
    const { subject, content } =
      this.contentService.buildDeliveryCompleted(orderId);

    await this.processor.process(
      NotificationType.EMAIL,
      userId,
      subject,
      content,
    );
  }
}
