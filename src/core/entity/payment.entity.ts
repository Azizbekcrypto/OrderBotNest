import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

export type PaymentStatus = 'paid' | 'failed';

// To'lov xizmatidan kelgan bitta xabar. payment_id — xizmatning o'z raqami, bazada noyob
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  payment_id: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'varchar' })
  status: PaymentStatus;

  @Column({ type: 'integer' })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
