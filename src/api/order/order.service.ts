import { Injectable } from '@nestjs/common';
import {
  CartItem,
  Order,
  OrderItem,
  OrderStatus,
  User,
} from '../../core/types';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class OrderService {
  // Buyurtmalar ro'yxati xotirada; id oddiy hisoblagich
  private readonly orders: Order[] = [];
  private nextId = 1;

  constructor(private readonly catalog: CatalogService) {}

  // Savatdan buyurtma: har mahsulot ombordan ayiriladi, keyin buyurtma yoziladi.
  // Birortasi yetmasa — oldin ayirilganlar qaytariladi (hammasi yoki hech narsa).
  place(user: User, cart: CartItem[]): Order {
    if (!user.phone) throw new Error('Telefon raqami yo‘q');
    if (cart.length === 0) throw new Error('Savat bo‘sh');
    const taken: OrderItem[] = [];
    try {
      for (const item of cart) {
        const p = this.catalog.take(item.productId, item.qty);
        taken.push({
          productId: p.id,
          name: p.name,
          price: p.price,
          qty: item.qty,
        });
      }
    } catch (e) {
      for (const t of taken) this.catalog.giveBack(t.productId, t.qty);
      throw e;
    }
    const order: Order = {
      id: this.nextId++,
      telegramId: user.telegramId,
      phone: user.phone,
      items: taken,
      total: taken.reduce((s, i) => s + i.price * i.qty, 0),
      status: 'NEW',
      createdAt: new Date(),
    };
    this.orders.push(order);
    return order;
  }

  recent(limit = 5): Order[] {
    return [...this.orders].reverse().slice(0, limit);
  }

  find(id: number): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  setStatus(id: number, status: OrderStatus): Order {
    const order = this.find(id);
    if (!order) throw new Error(`Buyurtma topilmadi: #${id}`);
    if (order.status === 'CANCELLED')
      throw new Error(`#${id} allaqachon bekor qilingan`);
    if (status === 'CANCELLED') {
      for (const i of order.items) this.catalog.giveBack(i.productId, i.qty);
    }
    order.status = status;
    return order;
  }
}
