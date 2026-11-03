import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem, User } from '../../core/entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem) private readonly repo: Repository<CartItem>,
  ) {}

  list(user: User): Promise<CartItem[]> {
    return this.repo.find({
      where: { user: { id: user.id } },
      order: { id: 'ASC' },
    });
  }

  // Bitta so'rov: yo'q bo'lsa INSERT, bor bo'lsa qty + 1 (ON CONFLICT — UNIQUE (user_id, product_id) ustiga)
  async add(user: User, productId: number): Promise<number> {
    const rows: { qty: number }[] = await this.repo.query(
      `INSERT INTO cart_items (user_id, product_id, qty) VALUES ($1, $2, 1)
       ON CONFLICT (user_id, product_id) DO UPDATE SET qty = cart_items.qty + 1
       RETURNING qty`,
      [user.id, productId],
    );
    return rows[0].qty;
  }

  async clear(user: User): Promise<void> {
    await this.repo.delete({ user: { id: user.id } });
  }
}
