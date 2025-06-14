import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../enums';
import { UserEntity } from './user.entity';
import { OrderEntity } from './order.entity';

@Entity('payment_transactions')
export class PaymentTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column()
  currency: string;

  @Column({ nullable: true })
  externalPaymentId: string; // ID из Stripe/PayPal

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @OneToOne(() => OrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  order: OrderEntity;
}
