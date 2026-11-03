import { Markup } from 'telegraf';
import { Order, Product } from '../../core/entity';
import { som } from './texts';

// Katalog sahifasi: har mahsulot — bitta tugma (callback "add:<id>"),
// pastda ◀ ▶ sahifalash ("page:<n>") va savat
export const catalogKeyboard = (
  items: Product[],
  page: number,
  pages: number,
) => {
  const rows = items.map((p) => [
    Markup.button.callback(
      p.stock > 0 ? `${p.name} · ${som(p.price)}` : `${p.name} · tugagan`,
      p.stock > 0 ? `add:${p.id}` : 'noop',
    ),
  ]);
  const nav: ReturnType<typeof Markup.button.callback>[] = [];
  if (page > 0) nav.push(Markup.button.callback('◀', `page:${page - 1}`));
  nav.push(Markup.button.callback(`${page + 1}/${pages}`, 'noop'));
  if (page < pages - 1)
    nav.push(Markup.button.callback('▶', `page:${page + 1}`));
  rows.push(nav);
  rows.push([Markup.button.callback('🛒 Savat', 'cart')]);
  return Markup.inlineKeyboard(rows);
};

export const cartKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('✅ Buyurtma berish', 'checkout')],
    [
      Markup.button.callback('🗑 Tozalash', 'cart:clear'),
      Markup.button.callback('➕ Yana', 'page:0'),
    ],
  ]);

// Admin: har buyurtma ostida status tugmalari ("status:<id>:<STATUS>")
export const orderKeyboard = (o: Order) => {
  if (o.status === 'DELIVERED' || o.status === 'CANCELLED') return undefined;
  const row =
    o.status === 'NEW'
      ? [
          Markup.button.callback('✅ Tasdiqlash', `status:${o.id}:CONFIRMED`),
          Markup.button.callback('❌ Bekor', `status:${o.id}:CANCELLED`),
        ]
      : [
          Markup.button.callback('🚚 Yetkazildi', `status:${o.id}:DELIVERED`),
          Markup.button.callback('❌ Bekor', `status:${o.id}:CANCELLED`),
        ];
  return Markup.inlineKeyboard([row]);
};
