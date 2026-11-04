import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../core/entity';
import { LiveGateway } from '../live/live.gateway';
import type { PaymentInput } from './payment-input';

@Injectable()
export class PaymentService {
  constructor(
    private readonly ds: DataSource,
    private readonly live: LiveGateway,
  ) {}

  // Bitta tranzaksiya: payments ga qator va orders.payment_status.
  // payment_id noyob: takror xabar (xizmat javobimizni olmay qayta yuborgan) — ON CONFLICT, hech narsa o'zgarmaydi.
  // Rad etilgan to'lov ham yoziladi — lekin oldin to'langan buyurtmani «rad» ga tushirmaydi.
  async record(p: PaymentInput): Promise<{ duplicate: boolean }> {
    const res = await this.ds.transaction(async (m) => {
      const order = await m.findOneBy(Order, { id: p.orderId });
      if (!order) {
        throw new BadRequestException(`buyurtma topilmadi: #${p.orderId}`);
      }
      if (p.amount !== order.total) {
        throw new BadRequestException(
          `summa mos emas: ${p.amount} ≠ ${order.total}`,
        );
      }
      const rows: unknown[] = await m.query(
        `INSERT INTO payments (payment_id, order_id, status, amount)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (payment_id) DO NOTHING
         RETURNING id`,
        [p.paymentId, p.orderId, p.status, p.amount],
      );
      if (rows.length === 0) return { duplicate: true };
      await m.query(
        `UPDATE orders SET payment_status = $1
         WHERE id = $2 AND payment_status IS DISTINCT FROM 'paid'`,
        [p.status, p.orderId],
      );
      return { duplicate: false };
    });
    // tranzaksiya tugadi — panel so'raganda to'lov bazada bor (WebSocket-1 qoidasi)
    if (!res.duplicate) this.live.orderChanged(p.orderId, 'payment');
    return res;
  }
}
