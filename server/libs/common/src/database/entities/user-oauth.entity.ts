import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_oauth')
@Index(['provider', 'providerId'], { unique: true })
export class UserOAuthEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string;

  @Column()
  providerId: string;

  @ManyToOne(() => UserEntity, (user) => user.oauthAccounts, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;
}
