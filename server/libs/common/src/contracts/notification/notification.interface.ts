import { NotificationStatus, NotificationType } from '../../database/enums';

export interface Notification {
  id: number;
  type: NotificationType;
  content: string;
  status: NotificationStatus;
  createdAt: Date;
  userId: number;
}
