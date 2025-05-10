import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TokenEntity } from './token.entity';
import { OrderEntity } from './order.entity';
import { UserRole } from '../enums';
import { ReviewEntity } from './review.entity';
import { UserOAuthEntity } from './user-oauth.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TokenEntity, (token) => token.user, { cascade: true })
  tokens: TokenEntity[];

  @OneToMany(() => UserOAuthEntity, (oauth) => oauth.user, { cascade: true })
  oauthAccounts: UserOAuthEntity[];

  @OneToMany(() => OrderEntity, (order) => order.user, { cascade: true })
  orders: OrderEntity[];

  @OneToMany(() => ReviewEntity, (order) => order.user, { cascade: true })
  reviews: ReviewEntity[];
}
