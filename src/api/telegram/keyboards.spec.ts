import { Order } from '../../core/entity';
import { catalogKeyboard, orderKeyboard } from './keyboards';

// Faqat tugmalar matni va callback'i — qolgani bizga kerak emas
const buttons = (kb: ReturnType<typeof orderKeyboard>) =>
  kb?.reply_markup.inline_keyboard.map((row) =>
    row.map((b) => [b.text, 'callback_data' in b ? b.callback_data : '']),
  );

const order = (status: Order['status']) => ({ id: 7, status }) as Order;

describe('orderKeyboard', () => {
  it('yangi buyurtma — Tasdiqlash va Bekor', () => {
    expect(buttons(orderKeyboard(order('NEW')))).toEqual([
      [
        ['✅ Tasdiqlash', 'status:7:CONFIRMED'],
        ['❌ Bekor', 'status:7:CANCELLED'],
      ],
    ]);
  });

  it('tasdiqlangan — Yetkazildi va Bekor', () => {
    expect(buttons(orderKeyboard(order('CONFIRMED')))).toEqual([
      [
        ['🚚 Yetkazildi', 'status:7:DELIVERED'],
        ['❌ Bekor', 'status:7:CANCELLED'],
      ],
    ]);
  });

  it("yetkazilgan va bekor qilingan — tugma yo'q", () => {
    expect(orderKeyboard(order('DELIVERED'))).toBeUndefined();
    expect(orderKeyboard(order('CANCELLED'))).toBeUndefined();
  });
});

const p = (id: number, stock = 5) =>
  ({ id, name: `M${id}`, price: 1000, stock }) as any;

// Oxirgidan oldingi qator — sahifalash: ◀ · 2/3 · ▶
const nav = (kb: ReturnType<typeof catalogKeyboard>) => {
  const rows = kb.reply_markup.inline_keyboard;
  return rows[rows.length - 2].map((b) => b.text);
};

describe('catalogKeyboard', () => {
  it("birinchi sahifada ◀ yo'q", () => {
    expect(nav(catalogKeyboard([p(1), p(2)], 0, 3))).toEqual(['1/3', '▶']);
  });

  it("o'rtada ikkalasi bor", () => {
    expect(nav(catalogKeyboard([p(3), p(4)], 1, 3))).toEqual(['◀', '2/3', '▶']);
  });

  it("oxirgi sahifada ▶ yo'q", () => {
    expect(nav(catalogKeyboard([p(5)], 2, 3))).toEqual(['◀', '3/3']);
  });

  it('bitta sahifa — faqat 1/1', () => {
    expect(nav(catalogKeyboard([p(1)], 0, 1))).toEqual(['1/1']);
  });

  it('tugagan mahsulot bosilmaydi', () => {
    const row = catalogKeyboard([p(9, 0)], 0, 1).reply_markup
      .inline_keyboard[0];
    expect(row[0]).toMatchObject({
      text: 'M9 · tugagan',
      callback_data: 'noop',
    });
  });
});
