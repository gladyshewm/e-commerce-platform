import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationProcessorService } from './notification-processor.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationEntity } from '@app/common/database/entities';
import {
  NotificationStatus,
  NotificationType,
} from '@app/common/database/enums';

jest.mock('./notification-dispatcher.service');

describe('NotificationProcessorService', () => {
  let processor: NotificationProcessorService;
  let dispatcher: jest.Mocked<NotificationDispatcherService>;
  let notificationRepository: jest.Mocked<Repository<NotificationEntity>>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessorService,
        NotificationDispatcherService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = app.get<NotificationProcessorService>(
      NotificationProcessorService,
    );
    dispatcher = app.get<jest.Mocked<NotificationDispatcherService>>(
      NotificationDispatcherService,
    );
    notificationRepository = app.get<
      jest.Mocked<Repository<NotificationEntity>>
    >(getRepositoryToken(NotificationEntity));
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(processor).toBeDefined();
    });
  });

  describe('process', () => {
    const channel = NotificationType.EMAIL;
    const userId = 1;
    const subject = 'test_subject';
    const content = 'test_content';
    const pendingNotification = {
      id: 1,
      type: channel,
      content,
      status: NotificationStatus.PENDING,
      user: { id: userId },
    } as NotificationEntity;
    const sentNotification = {
      ...pendingNotification,
      status: NotificationStatus.SENT,
    };

    beforeEach(async () => {
      notificationRepository.create.mockReturnValue({ ...pendingNotification });
      notificationRepository.save
        .mockResolvedValueOnce({ ...pendingNotification })
        .mockResolvedValueOnce({ ...sentNotification });
      await processor.process(channel, userId, subject, content);
    });

    it('should create and save notification', () => {
      expect(notificationRepository.create).toHaveBeenCalledWith({
        type: channel,
        content,
        status: NotificationStatus.PENDING,
        user: { id: userId },
      });
      expect(notificationRepository.save).toHaveBeenNthCalledWith(
        1,
        pendingNotification,
      );
    });

    it('should dispatch notification', () => {
      expect(dispatcher.dispatch).toHaveBeenCalledWith(channel, {
        userId,
        subject,
        content,
      });
    });

    it('should change notification status to SENT', () => {
      expect(notificationRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: NotificationStatus.SENT }),
      );
    });

    it('should change notification status to FAILED if dispatch fails', async () => {
      dispatcher.dispatch.mockRejectedValue(new Error('Failed to dispatch'));
      notificationRepository.create.mockReturnValue({ ...pendingNotification });
      notificationRepository.save
        .mockResolvedValueOnce({ ...pendingNotification })
        .mockResolvedValueOnce({ ...sentNotification });
      await processor.process(channel, userId, subject, content);

      expect(notificationRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: NotificationStatus.FAILED }),
      );
    });
  });
});
