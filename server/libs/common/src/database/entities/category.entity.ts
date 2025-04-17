import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @OneToMany(() => ProductEntity, (product) => product.category)
  products: ProductEntity[];
}
