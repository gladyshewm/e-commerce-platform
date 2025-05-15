import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationContentPayload } from '../types/notification-content.interface';

@Injectable()
export class NotificationContentService {
  constructor(private readonly configService: ConfigService) {}

  buildEmailActivation(
    username: string,
    emailToken: string,
  ): NotificationContentPayload {
    const url = this.configService.get<string>('API_URL'); // FIXME: replace with FRONTEND_URL
    const link = `${url}/users/activate?token=${emailToken}`;
    const subject = 'Account Activation';
    const content =
      `Hello, ${username}!\n` +
      `Follow the link below to activate your account:\n` +
      `${link}\n` +
      `This link expires in 24 hours.`;
    return { subject, content };
  }

  buildOrderCreated(orderId: number): NotificationContentPayload {
    const subject = 'Order Created';
    const content = `Order №${orderId} has been successfully created`;
    return { subject, content };
  }

  buildDeliveryScheduled(orderId: number): NotificationContentPayload {
    const subject = 'Delivery Scheduled';
    const content = `Delivery for order №${orderId} has been scheduled`;
    return { subject, content };
  }

  buildDeliveryStarted(orderId: number): NotificationContentPayload {
    const subject = 'Delivery Started';
    const content = `Delivery for order №${orderId} has been started`;
    return { subject, content };
  }

  buildDeliveryCompleted(orderId: number): NotificationContentPayload {
    const subject = 'Delivery Completed';
    const content = `Your order №${orderId} has been delivered!`;
    return { subject, content };
  }
}
