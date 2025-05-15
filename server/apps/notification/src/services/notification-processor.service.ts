import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationEntity } from '@app/common/database/entities';
import {
  NotificationStatus,
  NotificationType,
} from '@app/common/database/enums';

@Injectable()
export class NotificationProcessorService {
  private readonly logger = new Logger(NotificationProcessorService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  async process(
    channel: NotificationType,
    userId: number,
    subject: string,
    content: string,
  ): Promise<void> {
    const entity = this.notificationRepository.create({
      type: channel,
      content,
      status: NotificationStatus.PENDING,
      user: { id: userId },
    });
    const saved = await this.notificationRepository.save(entity);

    try {
      await this.dispatcher.dispatch(channel, { userId, subject, content });
      await this.notificationRepository.save({
        ...saved,
        status: NotificationStatus.SENT,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${saved.id}: ${error.message}`,
        error.stack,
      );
      await this.notificationRepository.save({
        ...saved,
        status: NotificationStatus.FAILED,
      });
    }
  }
}
