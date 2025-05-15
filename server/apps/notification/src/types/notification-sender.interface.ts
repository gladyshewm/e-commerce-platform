import { SendNotificationPayload } from './send-notification.interface';

export interface NotificationSender {
  send(payload: SendNotificationPayload): Promise<void>;
}
