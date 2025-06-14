import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { DeliveryStatus } from '../enums';

@Entity('deliveries')
export class DeliveryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
  })
  status: DeliveryStatus;

  @Column()
  scheduledAt: Date;

  @Column({ nullable: true })
  deliveredAt?: Date;

  @OneToOne(() => OrderEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  order: OrderEntity;
}
