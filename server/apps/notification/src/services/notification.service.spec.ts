import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationProcessorService } from './notification-processor.service';
import { NotificationContentService } from './notification-content.service';
import {
  OrderCreatedPayload,
  SendEmailActivationLinkPayload,
} from '@app/common/contracts/notification';
import { NotificationContentPayload } from '../types/notification-content.interface';
import { NotificationType } from '@app/common/database/enums';

jest.mock('./notification-processor.service');
jest.mock('./notification-content.service');

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let processor: jest.Mocked<NotificationProcessorService>;
  let contentService: jest.Mocked<NotificationContentService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        NotificationProcessorService,
        NotificationContentService,
      ],
    }).compile();

    notificationService = app.get<NotificationService>(NotificationService);
    processor = app.get<jest.Mocked<NotificationProcessorService>>(
      NotificationProcessorService,
    );
    contentService = app.get<jest.Mocked<NotificationContentService>>(
      NotificationContentService,
    );
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(notificationService).toBeDefined();
    });
  });

  const content: NotificationContentPayload = {
    subject: 'Test-subject',
    content: 'Test-content',
  };

  describe('sendEmailActivationLink', () => {
    const payload: SendEmailActivationLinkPayload = {
      userId: 1,
      username: 'username',
      token: 'email-token',
    };

    beforeEach(async () => {
      contentService.buildEmailActivation.mockReturnValue(content);
      await notificationService.sendEmailActivationLink(payload);
    });

    it('should build content', () => {
      expect(contentService.buildEmailActivation).toHaveBeenCalledWith(
        payload.username,
        payload.token,
      );
    });

    it('should process email notification', () => {
      expect(processor.process).toHaveBeenCalledWith(
        NotificationType.EMAIL,
        payload.userId,
        content.subject,
        content.content,
      );
    });

    // TODO: should process sms notification, should process push notification
  });

  describe('notifyUserOrderCreated', () => {
    const payload: OrderCreatedPayload = {
      userId: 1,
      orderId: 1,
    };

    beforeEach(async () => {
      contentService.buildOrderCreated.mockReturnValue(content);
      await notificationService.notifyUserOrderCreated(payload);
    });

    it('should build content', () => {
      expect(contentService.buildOrderCreated).toHaveBeenCalledWith(
        payload.orderId,
      );
    });

    it('should process email notification', () => {
      expect(processor.process).toHaveBeenCalledWith(
        NotificationType.EMAIL,
        payload.userId,
        content.subject,
        content.content,
      );
    });
  });

  describe('notifyUserDeliveryScheduled', () => {
    const payload: OrderCreatedPayload = {
      userId: 1,
      orderId: 1,
    };

    beforeEach(async () => {
      contentService.buildDeliveryScheduled.mockReturnValue(content);
      await notificationService.notifyUserDeliveryScheduled(payload);
    });

    it('should build content', () => {
      expect(contentService.buildDeliveryScheduled).toHaveBeenCalledWith(
        payload.orderId,
      );
    });

    it('should process email notification', () => {
      expect(processor.process).toHaveBeenCalledWith(
        NotificationType.EMAIL,
        payload.userId,
        content.subject,
        content.content,
      );
    });
  });

  describe('notifyUserDeliveryStarted', () => {
    const payload: OrderCreatedPayload = {
      userId: 1,
      orderId: 1,
    };

    beforeEach(async () => {
      contentService.buildDeliveryStarted.mockReturnValue(content);
      await notificationService.notifyUserDeliveryStarted(payload);
    });

    it('should build content', () => {
      expect(contentService.buildDeliveryStarted).toHaveBeenCalledWith(
        payload.orderId,
      );
    });

    it('should process email notification', () => {
      expect(processor.process).toHaveBeenCalledWith(
        NotificationType.EMAIL,
        payload.userId,
        content.subject,
        content.content,
      );
    });
  });

  describe('notifyUserDeliveryCompleted', () => {
    const payload: OrderCreatedPayload = {
      userId: 1,
      orderId: 1,
    };

    beforeEach(async () => {
      contentService.buildDeliveryCompleted.mockReturnValue(content);
      await notificationService.notifyUserDeliveryCompleted(payload);
    });

    it('should build content', () => {
      expect(contentService.buildDeliveryCompleted).toHaveBeenCalledWith(
        payload.orderId,
      );
    });

    it('should process email notification', () => {
      expect(processor.process).toHaveBeenCalledWith(
        NotificationType.EMAIL,
        payload.userId,
        content.subject,
        content.content,
      );
    });
  });
});
