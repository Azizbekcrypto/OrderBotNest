import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// products — PG-2 darsidagi jadvalning o'zi: id, name, price, stock
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'integer' })
  price: number; // so'm

  @Column({ type: 'integer', default: 0 })
  stock: number; // omborda nechta; bazada CHECK (stock >= 0)
}
