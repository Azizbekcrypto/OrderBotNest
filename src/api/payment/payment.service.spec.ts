import { BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';

// Baza o'rniga mock tranzaksiya: findOneBy — buyurtma, query — INSERT … RETURNING natijasi
const order = { id: 5, total: 120000 };
function setup(inserted: unknown[]) {
  const m = {
    findOneBy: jest.fn(async (_e: unknown, w: { id: number }) =>
      w.id === order.id ? order : null,
    ),
    query: jest.fn(async (sql: string) => (/INSERT/.test(sql) ? inserted : [])),
  };
  const ds = {
    transaction: jest.fn(async (fn: (x: typeof m) => unknown) => fn(m)),
  };
  const live = { orderChanged: jest.fn() };
  return { m, live, s: new PaymentService(ds as never, live as never) };
}
const pay = {
  paymentId: 'pay_1',
  orderId: 5,
  status: 'paid' as const,
  amount: 120000,
};

describe('PaymentService.record', () => {
  it("yangi to'lov — yoziladi, buyurtma holati, panelga hodisa", async () => {
    const { m, live, s } = setup([{ id: 1 }]);
    await expect(s.record(pay)).resolves.toEqual({ duplicate: false });
    expect(m.query).toHaveBeenCalledTimes(2); // INSERT va UPDATE orders
    expect(live.orderChanged).toHaveBeenCalledWith(5, 'payment');
  });

  it("takror (payment_id bor) — hech narsa o'zgarmaydi, hodisa yo'q", async () => {
    const { m, live, s } = setup([]);
    await expect(s.record(pay)).resolves.toEqual({ duplicate: true });
    expect(m.query).toHaveBeenCalledTimes(1); // faqat INSERT … ON CONFLICT DO NOTHING
    expect(live.orderChanged).not.toHaveBeenCalled();
  });

  it('summa mos emas — 400, yozilmaydi', async () => {
    const { m, s } = setup([{ id: 1 }]);
    await expect(s.record({ ...pay, amount: 1200 })).rejects.toThrow(
      BadRequestException,
    );
    expect(m.query).not.toHaveBeenCalled();
  });

  it("buyurtma yo'q — 400", async () => {
    const { s } = setup([{ id: 1 }]);
    await expect(s.record({ ...pay, orderId: 99 })).rejects.toThrow(
      'buyurtma topilmadi: #99',
    );
  });
});
