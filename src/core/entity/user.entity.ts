import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type Role = 'customer' | 'admin';
export type UserState = 'IDLE' | 'WAITING_PHONE';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // Telegram id 32 bitga sig'maydi (5 123 456 789) — BIGINT.
  // node-pg BIGINT'ni MATN qilib qaytaradi, shuning uchun tipi string.
  @Column({ name: 'telegram_id', type: 'bigint', unique: true })
  telegram_id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', default: 'customer' })
  role: Role;

  // Suhbat qaysi bosqichda — bazada, server qayta ishga tushsa ham qoladi
  @Column({ type: 'varchar', default: 'IDLE' })
  state: UserState;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
