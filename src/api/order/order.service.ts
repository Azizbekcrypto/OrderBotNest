import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CartItem,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  User,
} from '../../core/entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    private readonly ds: DataSource,
  ) {}

  // Buyurtma — bitta tranzaksiya: har mahsulot ombordan ayiriladi (UPDATE),
  // buyurtma va qatorlari yoziladi (INSERT), savat tozalanadi (DELETE).
  // Birortasi yiqilsa — hammasi qaytadi (ROLLBACK). Qoldiq yetmasa bazadagi
  // CHECK (stock >= 0) rad etadi — ikki mijoz bir vaqtda bossa ham ortiqcha sotilmaydi.
  place(user: User, cart: CartItem[]): Promise<Order> {
    if (!user.phone) throw new Error("Telefon raqami yo'q");
    if (cart.length === 0) throw new Error("Savat bo'sh");
    return this.ds.transaction(async (m) => {
      const items: OrderItem[] = [];
      for (const c of cart) {
        // 1) Qatorni qulflab o'qiymiz (SELECT ... FOR UPDATE): ikkinchi mijoz shu qatorni biz tugatguncha kutadi
        const p = await m.findOne(Product, {
          where: { id: c.product.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!p) throw new Error(`Mahsulot topilmadi: ${c.product.name}`);
        if (p.stock < c.qty) {
          throw new Error(`${p.name}: omborda faqat ${p.stock} ta qoldi`);
        }
        // 2) Ayiramiz. Bazadagi CHECK (stock >= 0) — oxirgi qo'riqchi: kod xato qilsa ham manfiy bo'lmaydi.
        //    Diqqat: tranzaksiya ichida xato chiqsa, keyingi so'rovlar ham rad etiladi
        //    («current transaction is aborted») — faqat ROLLBACK qoladi.
        await m.query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [
          c.qty,
          p.id,
        ]);
        items.push(
          m.create(OrderItem, { product: p, qty: c.qty, price: p.price }),
        );
      }
      const order = m.create(Order, {
        user,
        phone: user.phone!,
        status: 'NEW',
        total: items.reduce((s, i) => s + i.price * i.qty, 0),
        items,
      });
      const saved = await m.save(order);
      await m.delete(CartItem, { user: { id: user.id } });
      return saved;
    });
  }

  recent(limit = 5): Promise<Order[]> {
    return this.repo.find({ order: { id: 'DESC' }, take: limit });
  }

  // Status o'zgaradi; bekor qilinsa mahsulotlar omborga qaytadi — yana tranzaksiya
  setStatus(id: number, status: OrderStatus): Promise<Order> {
    return this.ds.transaction(async (m) => {
      // Buyurtma qatorini qulflaymiz: «Bekor» ikki marta bir vaqtda bosilsa,
      // ikkinchisi birinchisi tugashini kutadi va CANCELLED ni ko'radi — ombor bir marta qaytadi
      await m.query('SELECT id FROM orders WHERE id = $1 FOR UPDATE', [id]);
      const order = await m.findOneBy(Order, { id });
      if (!order) throw new Error(`Buyurtma topilmadi: #${id}`);
      if (order.status === 'CANCELLED') {
        throw new Error(`#${id} allaqachon bekor qilingan`);
      }
      if (status === 'CANCELLED') {
        for (const i of order.items) {
          await m.increment(Product, { id: i.product.id }, 'stock', i.qty);
        }
      }
      order.status = status;
      return m.save(order);
    });
  }
}
