import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('tokens')
export class TokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  refreshToken: string;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @ManyToOne(() => UserEntity, (user) => user.tokens, { onDelete: 'CASCADE' })
  user: UserEntity;
}
