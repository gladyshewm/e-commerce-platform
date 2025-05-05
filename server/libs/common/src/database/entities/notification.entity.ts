import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationStatus, NotificationType } from '../enums';
import { UserEntity } from './user.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity)
  user: UserEntity;
}
