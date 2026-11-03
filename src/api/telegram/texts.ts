import { CartItem, Order, OrderStatus, Product } from '../../core/entity';

// 120000 → "120 000 so'm"
export const som = (n: number) => `${n.toLocaleString('ru-RU')} so'm`;

export const STATUS_UZ: Record<OrderStatus, string> = {
  NEW: '🆕 Yangi',
  CONFIRMED: '✅ Tasdiqlangan',
  DELIVERED: '🚚 Yetkazilgan',
  CANCELLED: '❌ Bekor qilingan',
};

const itemLines = (
  items: { product: Product; qty: number; price?: number }[],
) =>
  items
    .map(
      (i) =>
        `• ${i.product.name} × ${i.qty} = ${som((i.price ?? i.product.price) * i.qty)}`,
    )
    .join('\n');

export const texts = {
  start: (name: string, isAdmin: boolean) =>
    `Salom, ${name}! Bu CoddyCamp do'koni boti.\n` +
    `/catalog — mahsulotlar\n/cart — savat\n/help — yordam` +
    (isAdmin ? `\n/orders — buyurtmalar (admin)` : ''),
  help:
    `/catalog — mahsulotlarni ko'rish va savatga qo'shish\n` +
    `/cart — savat va buyurtma berish\n` +
    `/start — boshidan`,
  catalogTitle: (page: number, pages: number) =>
    `Katalog (${page + 1}/${pages}-sahifa). Qo'shish uchun mahsulotni bosing:`,
  added: (p: Product, qty: number) =>
    `${p.name} savatga qo'shildi (${qty} ta).`,
  cartEmpty: `Savat bo'sh. /catalog dan mahsulot tanlang.`,
  cart: (items: CartItem[], total: number) =>
    `Savat:\n${itemLines(items)}\n\nJami: ${som(total)}`,
  cartCleared: `Savat tozalandi.`,
  askPhone: `Buyurtma uchun telefon raqamingizni yozing (masalan, +998901234567):`,
  badPhone: `Raqam noto'g'ri. Masalan: +998901234567`,
  orderPlaced: (o: Order) =>
    `Buyurtma #${o.id} qabul qilindi!\n${itemLines(o.items)}\n\n` +
    `Jami: ${som(o.total)}\nTelefon: ${o.phone}\nHolati: ${STATUS_UZ[o.status]}`,
  orderFailed: (reason: string) => `Buyurtma berilmadi: ${reason}`,
  adminNewOrder: (o: Order, customer: string) =>
    `🆕 Yangi buyurtma #${o.id} — ${customer}, ${som(o.total)}. /orders`,
  adminOnly: `Bu buyruq faqat admin uchun.`,
  noOrders: `Hozircha buyurtma yo'q.`,
  orderLine: (o: Order) =>
    `#${o.id} · ${o.user.name} · ${som(o.total)} · ${STATUS_UZ[o.status]}\n` +
    o.items.map((i) => `   ${i.product.name} × ${i.qty}`).join('\n'),
  statusChanged: (o: Order) => `#${o.id} → ${STATUS_UZ[o.status]}`,
  customerStatus: (o: Order) => `Buyurtmangiz #${o.id}: ${STATUS_UZ[o.status]}`,
  unknown: `Tushunmadim. /help ni bosing.`,
};
