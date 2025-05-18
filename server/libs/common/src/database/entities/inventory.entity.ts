import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('inventories')
export class InventoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { default: 0 })
  availableQuantity: number;

  @Column('int', { default: 0 })
  reservedQuantity: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => ProductEntity, { cascade: false, onDelete: 'CASCADE' })
  @JoinColumn()
  product: ProductEntity;
}
