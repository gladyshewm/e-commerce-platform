import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { catchError, lastValueFrom } from 'rxjs';
import { NotificationEntity } from '@app/common/database/entities';
import {
  NotificationStatus,
  NotificationType,
} from '@app/common/database/enums';
import {
  Notification,
  OrderCreatedPayload,
} from '@app/common/contracts/notification';
import { USER_SERVICE } from '@app/common/constants';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { SendNotification } from './types/send-notification.interface';
import { SendMail } from './types/send-mail.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    private readonly mailerService: MailerService,
    @Inject(USER_SERVICE)
    private readonly userServiceClient: ClientProxy,
  ) {}

  async notifyUserOrderCreated(payload: OrderCreatedPayload) {
    const content = `Order №${payload.orderId} has been successfully created`;
    const subject = 'Order Created';
    await this.sendNotification({
      userId: payload.userId,
      content,
      subject,
    });
  }

  async notifyUserDeliveryScheduled(payload: OrderCreatedPayload) {
    const content = `Delivery for order with №${payload.orderId} has been scheduled`;
    const subject = 'Delivery Scheduled';
    await this.sendNotification({
      userId: payload.userId,
      subject,
      content,
    });
  }

  async notifyUserDeliveryStarted(payload: OrderCreatedPayload) {
    const content = `Delivery for order with №${payload.orderId} has been started`;
    const subject = 'Delivery Started';
    await this.sendNotification({
      userId: payload.userId,
      subject,
      content,
    });
  }

  async notifyUserDeliveryCompleted(payload: OrderCreatedPayload) {
    const content = `Your order with №${payload.orderId} has been delivered!`;
    const subject = 'Delivery Completed';
    await this.sendNotification({
      userId: payload.userId,
      subject,
      content,
    });
  }

  private async sendNotification(payload: SendNotification) {
    const { userId, content, subject } = payload;
    const notification = this.notificationRepository.create({
      type: NotificationType.EMAIL,
      content,
      status: NotificationStatus.PENDING,
      user: { id: userId },
    });
    const saved = await this.notificationRepository.save(notification);

    try {
      const email = await this.getUserEmail(userId);

      await this.sendMail({
        to: email,
        subject,
        text: content,
      });

      await this.updateNotificationStatus(saved.id, NotificationStatus.SENT);

      this.logger.log(
        `Notification ${saved.id} for the user with ID ${payload.userId} about the order creation has been sent`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error.message}`,
        error.stack,
      );
      await this.updateNotificationStatus(saved.id, NotificationStatus.FAILED);
    }
  }

  async updateNotificationStatus(
    notificationId: number,
    status: NotificationStatus,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['user'],
    });

    if (!notification) {
      this.logger.error(`Notification with id ${notificationId} not found`);
      throw new RpcException({
        message: `Notification with id ${notificationId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const existingStatus = notification.status;

    if (existingStatus === status) {
      this.logger.log(
        `Notification with id ${notificationId} already has status ${status}`,
      );
      return {
        id: notification.id,
        type: notification.type,
        content: notification.content,
        status: notification.status,
        createdAt: notification.createdAt,
        userId: notification.user.id,
      };
    }

    notification.status = status;
    const saved = await this.notificationRepository.save(notification);

    this.logger.log(
      `Notification with id ${notificationId} updated from ${existingStatus.toUpperCase()} to ${status.toUpperCase()}`,
    );

    return {
      id: saved.id,
      type: saved.type,
      content: saved.content,
      status: saved.status,
      createdAt: saved.createdAt,
      userId: saved.user.id,
    };
  }

  private async sendMail(payload: SendMail): Promise<void> {
    const { to, subject, text } = payload;
    await this.mailerService.sendMail({
      to,
      subject,
      text,
    });
  }

  private async getUserEmail(userId: number): Promise<string> {
    const user = await lastValueFrom(
      this.userServiceClient
        .send<UserWithoutPassword>('get_user_by_id', {
          id: userId,
        })
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              statusCode: error.statusCode,
            });
          }),
        ),
    );
    return user.email;
  }
}
