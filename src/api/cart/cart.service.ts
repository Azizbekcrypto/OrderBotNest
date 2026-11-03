import { Injectable } from '@nestjs/common';
import { CartItem } from '../../core/types';

@Injectable()
export class CartService {
  // telegramId → savat. Xotirada.
  private readonly carts = new Map<number, CartItem[]>();

  list(telegramId: number): CartItem[] {
    return this.carts.get(telegramId) ?? [];
  }

  add(telegramId: number, productId: number): CartItem[] {
    const cart = this.list(telegramId);
    const bor = cart.find((i) => i.productId === productId);
    if (bor) bor.qty += 1;
    else cart.push({ productId, qty: 1 });
    this.carts.set(telegramId, cart);
    return cart;
  }

  clear(telegramId: number): void {
    this.carts.delete(telegramId);
  }
}
