import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { User } from './user.entity';

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'integer' })
  total: number;

  @Column({ type: 'varchar', default: 'NEW' })
  status: OrderStatus;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true, eager: true })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
