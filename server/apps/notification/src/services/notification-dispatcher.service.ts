import { Inject, Injectable, Logger } from '@nestjs/common';
import { EMAIL_SENDER } from '../constants/senders-tokens';
import { NotificationSender } from '../types/notification-sender.interface';
import { NotificationType } from '@app/common/database/enums';
import { SendNotificationPayload } from '../types/send-notification.interface';

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    @Inject(EMAIL_SENDER) private readonly emailSender: NotificationSender,
    // @Inject(SMS_SENDER) private readonly smsSender: NotificationSender,
    // @Inject(PUSH_SENDER) private readonly pushSender: NotificationSender,
  ) {}

  async dispatch(
    channel: NotificationType,
    payload: SendNotificationPayload,
  ): Promise<void> {
    this.logger.log(`Dispatching notification to ${channel}`);
    switch (channel) {
      case NotificationType.EMAIL:
        return this.emailSender.send(payload);
      // case NotificationType.SMS:
      //   return this.smsSender.send(payload);
      // case NotificationType.PUSH:
      //   return this.pushSender.send(payload);
      default:
        this.logger.error(
          `Unknown notification channel: ${channel}. Notification will not be sent!`,
        );
        throw new Error(`Unknown notification channel: ${channel}`);
    }
  }
}
