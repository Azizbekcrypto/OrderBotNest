# OrderBotNest — CoddyCamp do'koni boti

Mentor kursi loyihasi: Telegram buyurtma boti. **NestJS + Telegraf**, keyin **TypeORM + PostgreSQL**.
Bot: katalog (inline tugmalar, sahifalash) → savat → buyurtma (telefon) → admin tasdiqlaydi, mijozga xabar boradi.

## 5 daqiqada ishga tushirish

1. Yuklab oling va papkaga kiring:
   ```bash
   git clone https://github.com/Azizbekcrypto/OrderBotNest.git
   cd OrderBotNest
   ```
2. Kutubxonalar: `npm install`
3. `.env.example` → nusxa `.env`. `BOT_TOKEN=` ga @BotFather bergan tokenni, `ADMIN_TELEGRAM_IDS=` ga o'z Telegram id'ingizni yozing (@userinfobot).
4. `npm run start:dev` — terminalda «Telegram bot ulandi».
5. Telegramda botga `/start`, keyin `/catalog`.

## Buyruqlar

| Kim | Buyruq / tugma | Nima bo'ladi |
|---|---|---|
| mijoz | `/catalog` | mahsulotlar, 2 tadan sahifa, ◀ ▶; mahsulot bosilsa savatga qo'shiladi |
| mijoz | `/cart` | savat, jami; «✅ Buyurtma berish», «🗑 Tozalash» |
| mijoz | «✅ Buyurtma berish» | telefon so'raydi (bir marta), buyurtma yaratadi, ombordan ayiradi |
| admin | `/orders` | oxirgi 5 buyurtma, har birida «✅ Tasdiqlash / 🚚 Yetkazildi / ❌ Bekor» |
| admin | holat tugmasi | holat o'zgaradi, mijozga xabar boradi; bekor qilinsa mahsulot omborga qaytadi |

## Papkalar

```
src/
  main.ts                      — serverni ko'taradi
  config/index.ts              — .env o'qiladi (BOT_TOKEN, ADMIN_TELEGRAM_IDS, PORT)
  core/types.ts                — Product, User, CartItem, Order tushunchalari
  api/app.module.ts            — modullar yig'iladi
  api/telegram/                — bot: buyruqlar, tugmalar (keyboards.ts), matnlar (texts.ts)
  api/catalog/                 — mahsulotlar va ombor (stock)
  api/user/                    — foydalanuvchi: rol (admin/customer), telefon, suhbat holati (state)
  api/cart/                    — savat
  api/order/                   — buyurtma: yaratish, holatini o'zgartirish
```

## Teglar

| Teg | Holat |
|---|---|
| `tgpg-start` | bot to'liq ishlaydi, lekin **hammasi xotirada**: server qayta ishga tushsa savat, buyurtmalar, telefonlar yo'qoladi |
| `tgpg-done` | hammasi **PostgreSQL**da: TypeORM, migratsiyalar, tranzaksiya, `CHECK (stock >= 0)` |

Mentor darsi `tgpg-start` dan boshlanadi: `git checkout tgpg-start`.

## Xatolar

| Terminalda | Sabab | Yechim |
|---|---|---|
| `BOT_TOKEN topilmadi` | `.env` yo'q yoki bo'sh | `.env.example` dan nusxa, token yozing |
| `Telegram ulanmadi: 401: Unauthorized` | token noto'g'ri; server ishlayveradi, bot jim | @BotFather dan tokenni qayta oling |
| `409: Conflict: terminated by other getUpdates request` | shu token bilan ikkinchi nusxa ishlayapti | eski jarayonni to'xtating |
