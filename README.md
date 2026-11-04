[![CI](https://github.com/Azizbekcrypto/OrderBotNest/actions/workflows/ci.yml/badge.svg)](https://github.com/Azizbekcrypto/OrderBotNest/actions/workflows/ci.yml)

# OrderBotNest — CoddyCamp do'koni boti

Mentor kursi loyihasi: Telegram buyurtma boti. **NestJS + Telegraf + TypeORM + PostgreSQL 18.**
Bot: katalog (inline tugmalar, sahifalash) → savat → buyurtma (telefon) → admin tasdiqlaydi, mijozga xabar boradi.
Do'kon uchun jonli panel (`/admin`): yangi buyurtmalar va holatlar sahifani yangilamasdan ko'rinadi (WebSocket).
Hammasi bazada: server qayta ishga tushsa ham savat, buyurtmalar, telefonlar qoladi.

## 5 daqiqada ishga tushirish

1. Yuklab oling va papkaga kiring:
   ```bash
   git clone https://github.com/Azizbekcrypto/OrderBotNest.git
   cd OrderBotNest
   ```
2. Kutubxonalar: `npm install`
3. PostgreSQL'da baza oching (psql): `CREATE DATABASE shop;`
4. `.env.example` → nusxa `.env`:
   - `BOT_TOKEN=` — @BotFather bergan token
   - `ADMIN_TELEGRAM_IDS=` — o'z Telegram id'ingiz (@userinfobot), vergul bilan bir nechta
   - `DATABASE_URL=postgresql://postgres:parol@localhost:5432/shop` — o'z parolingiz
   - `ADMIN_PANEL_TOKEN=` — jonli panel uchun maxfiy so'z (o'zingiz o'ylab topasiz)
5. Katalogni to'ldiring: `npm run seed` (jadvallarni migratsiya o'zi yaratadi, 6 ta mahsulot kiradi)
6. `npm run start:dev` — terminalda «Telegram bot ulandi».
7. Telegramda botga `/start`, keyin `/catalog`.

`DB_LOGGING=true` bo'lsa TypeORM har SQL so'rovni terminalga yozadi — bot nima qilayotganini SQL tilida ko'rasiz.

## Buyruqlar

| Kim | Buyruq / tugma | Nima bo'ladi |
|---|---|---|
| mijoz | `/catalog` | mahsulotlar, 2 tadan sahifa, ◀ ▶; mahsulot bosilsa savatga qo'shiladi |
| mijoz | `/cart` | savat, jami; «✅ Buyurtma berish», «🗑 Tozalash» |
| mijoz | «✅ Buyurtma berish» | telefon so'raydi (bir marta), buyurtma yaratadi, ombordan ayiradi |
| admin | `/orders` | oxirgi 5 buyurtma, har birida «✅ Tasdiqlash / 🚚 Yetkazildi / ❌ Bekor» |
| admin | status tugmasi | status o'zgaradi, mijozga xabar boradi; bekor qilinsa mahsulot omborga qaytadi |

## Jonli panel (WebSocket)

Do'kon kompyuterida ochiq turadigan sahifa: **http://localhost:3000/admin** → `.env` dagi `ADMIN_PANEL_TOKEN` ni kiriting.
Bot yangi buyurtma olganda yoki admin holatni o'zgartirganda ro'yxat **o'zi yangilanadi** — sahifani qayta ochish shart emas.

| Real vaqt nuqtasi | Kim nima qiladi | Hodisa | Kim oladi | Panelda nima o'zgaradi |
|---|---|---|---|---|
| buyurtmalar ro'yxati | mijoz botda buyurtma beradi | `order-changed` · `reason: 'new'` | hamma ulangan panel | yangi qator (sariq) |
| buyurtma holati | admin botda «Tasdiqlash / Yetkazildi / Bekor» bosadi | `order-changed` · `reason: 'status'` | hamma ulangan panel | «Holat» ustuni |

`order-changed` — `{ orderId, reason }`: faqat qaysi buyurtma va nega. Yangi ro'yxatni panel `GET /admin/orders` dan qayta so'raydi (token — `Authorization: Bearer …`).
Hodisa tranzaksiya tugagandan keyin yuboriladi: panel so'raganda buyurtma bazada bor.

- Ulanish — socket.io (`@nestjs/websockets`, `@nestjs/platform-socket.io`), HTTP bilan bitta portda. Token ulanish ochilayotganda tekshiriladi (`auth: { token }`); noto'g'ri bo'lsa server ulanishni yopadi.
- Panel belgisi: **Ulangan** — hodisalar keladi · **Ulanmoqda…** — server javob bermayapti, klient o'zi qayta urinmoqda · **Ulanmagan** — token noto'g'ri, klient urinmaydi.
- Brauzersiz tekshirish: `npm run live` — terminal klienti (`npm run live -- notogri` — noto'g'ri token bilan).
- Telegram'siz tekshirish: `npm run smoke -- live`.

### Qayta ulanish: uzilish paytidagi hodisa kelmaydi

socket.io ulanishni o'zi tiklaydi, lekin **ulanish yo'q paytda yuborilgan `order-changed` qayta kelmaydi**: server uni faqat hozir ulangan panellarga yuboradi. Shuning uchun panel **har `connect` da** (birinchi va har qayta ulanishda) ro'yxatni `GET /admin/orders` dan qayta so'raydi. `npm run live` ham shunday: `connect` dan keyin `GET /admin/orders → N ta, eng yangisi #…`.

- Ro'yxat ikki joyda so'raladi: `connect` va `order-changed`. Tinglovchi **bir marta, `connect` dan tashqarida** qo'shiladi — ichida bo'lsa har qayta ulanishda yana bittasi qo'shiladi va bitta hodisaga bir nechta `GET` ketadi.
- Qanday buziladi va qanday tekshiriladi — `BUZISH.md`.

## To'lov webhook'i

To'lov xizmati (Payme, Click kabi) mijoz to'laganini **o'zi** serverga xabar qiladi: `POST /payments/webhook`. Ilova yoki mijozning «to'ladim» degani dalil emas — dalil faqat xizmatning imzoli xabari.

| Qadam | Nima tekshiriladi | Xato bo'lsa |
|---|---|---|
| 1 · imzo | `X-Signature` = HMAC-SHA256(**xom tana**, `PAYMENT_WEBHOOK_SECRET`) | `401`, hech narsa yozilmaydi |
| 2 · maydonlar | `paymentId`, `orderId`, `status: 'paid' \| 'failed'`, `amount` | `400` |
| 3 · buyurtma | buyurtma bor va `amount` = `total` | `400` |
| 4 · yozuv | `payments` ga qator — `payment_id` noyob | takror: `200 { duplicate: true }`, ikkinchi qator yo'q |
| 5 · panel | `order-changed { orderId, reason: 'payment' }` | — |

- Imzo **yozuvdan oldin** tekshiriladi. Kalit faqat `.env` da (va hostingda) — kodga, git'ga, chatga yozilmaydi; bo'sh bo'lsa har xabar `401`.
- Imzo baytlardan hisoblanadi: server `rawBody: true` bilan ishga tushadi (`main.ts`). JSON qayta yozilsa (bo'sh joy, kalitlar tartibi) imzo mos kelmaydi.
- Rad etilgan to'lov ham yoziladi (`status: 'failed'`); oldin to'langan buyurtmani «rad» ga tushirmaydi. Panelda «To'lov» ustuni.
- Lokal sinov (haqiqiy xizmatsiz): `npm run pay -- <buyurtma raqami> [ok | rad | ikki | imzosiz | soxta]` — xabarni xizmat kabi imzolab yuboradi.
- Telegram'siz tekshirish: `npm run smoke -- payment`.

## Baza

| Jadval | Nima | Muhim ustun / qoida |
|---|---|---|
| `products` | katalog va ombor | `stock INTEGER`, **`CHECK (stock >= 0)`** — ortiqcha sotib bo'lmaydi |
| `users` | kim yozdi | **`telegram_id BIGINT UNIQUE`** (Telegram id 32 bitga sig'maydi), `role`, `phone`, `state` |
| `cart_items` | savat | `UNIQUE (user_id, product_id)` — bitta mahsulot bitta qator, `qty` o'sadi |
| `orders` | buyurtma | `status`: NEW → CONFIRMED → DELIVERED / CANCELLED, `total`, `phone` |
| `order_items` | buyurtma qatorlari | `price` — buyurtma paytidagi narx (keyin o'zgarsa ham qoladi) |

Buyurtma — bitta **tranzaksiya**: har mahsulot `SELECT … FOR UPDATE` → `UPDATE stock = stock - qty` → `INSERT orders, order_items` → `DELETE cart_items`. Birortasi yiqilsa hammasi qaytadi (ROLLBACK).

Jadvallar faqat **migratsiya** bilan o'zgaradi (`synchronize: false`): `src/infrastructure/migrations/`. Server ko'tarilganda yurmagan migratsiyalar o'zi yuradi (`migrationsRun: true`).
Qo'lda: `npm run migration:run` · `npm run migration:revert` · entity o'zgargach `npm run migration:generate`.

## Papkalar

```
src/
  main.ts                           — serverni ko'taradi
  config/index.ts                   — .env o'qiladi (BOT_TOKEN, ADMIN_TELEGRAM_IDS, ADMIN_PANEL_TOKEN, PAYMENT_WEBHOOK_SECRET, DATABASE_URL, DB_LOGGING, PORT)
  core/entity/                      — jadvallar: product, user, cart-item, order, order-item, payment
  infrastructure/data-source.ts     — bitta ulanish sozlamasi (Nest ham, typeorm CLI ham)
  infrastructure/database.module.ts — TypeOrmModule.forRoot + migratsiyalar avto
  infrastructure/migrations/        — SQL migratsiyalar
  infrastructure/seed.ts            — npm run seed (6 ta mahsulot)
  api/app.module.ts                 — modullar yig'iladi
  api/telegram/                     — bot: buyruqlar, tugmalar (keyboards.ts), matnlar (texts.ts)
  api/catalog/                      — mahsulotlar: sahifalash (LIMIT/OFFSET)
  api/user/                         — foydalanuvchi: SELECT → INSERT, rol, telefon, state
  api/cart/                         — savat: INSERT … ON CONFLICT DO UPDATE
  api/order/                        — buyurtma: tranzaksiya, status, bekor → ombor qaytadi
  api/live/                         — jonli panel: gateway (order-changed), /admin sahifasi va GET /admin/orders
  api/payment/                      — to'lov webhook'i: imzo (signature.ts), maydonlar, takror (payment_id noyob)
public/admin.html                   — panel sahifasi (socket.io klienti)
scripts/smoke.js                    — npm run smoke: Telegram'siz tekshiruv
scripts/live-client.js              — npm run live: terminaldan panel kabi ulanish
scripts/pay.js                      — npm run pay: soxta to'lov xizmati (imzolab webhook yuboradi)
```

## Tekshiruv: `npm run smoke`

Botni Telegram'siz sinaydi: haqiqiy kod, xabarlar ichkaridan beriladi, javoblar ushlanadi — Telegram'ga so'rov ketmaydi.
Bazangiz o'zgarmaydi: smoke vaqtinchalik `<baza>_smoke` bazasini ochadi va oxirida o'chiradi.

```bash
npm run smoke            # hammasi
npm run smoke -- restart # savat, buyurtma va telefon kutish restartdan o'tadimi
npm run smoke -- race    # 1 ta Planshet, 5 mijoz bir vaqtda (3 raund) + ikki marta bir vaqtda «Bekor»
npm run smoke -- live    # jonli panel: tokensiz ulanish yopiladimi, buyurtma va holat order-changed bo'lib keladimi
```

`tgpg-start` da `restart` 0/3 chiqadi — hammasi xotirada, shu darsning muammosi. `tgpg-done` da 5/5, `ws1-done` da 9/9 (live bilan).
AI kodni o'zgartirgandan keyin har bosqichda yurgizing: ✗ chiqsa, qaysi band ekanini o'qing.

## Teglar

| Teg | Nima bor |
|---|---|
| `tgpg-start` | bot to'liq ishlaydi, lekin **hammasi xotirada**: server qayta ishga tushsa savat, buyurtmalar, telefonlar yo'qoladi |
| `tgpg-done` | hammasi **PostgreSQL**da: TypeORM, migratsiyalar, tranzaksiya, `CHECK (stock >= 0)` |
| `jest1-start` / `jest1-done` | birinchi unit-testlar: `texts.spec.ts`, `keyboards.spec.ts` |
| `jest2-start` / `jest2-done` | xato yo'li va chegara: `phone.ts`, `order.service.spec.ts` (mock), `app.controller.spec.ts` (supertest) |
| `cicd1-start` / `cicd1-done` | GitHub Actions lentasi: `npm ci` · `tsc` · `test` · `build` |
| `cicd2-start` / `cicd2-done` | lentada `smoke` job (`services: postgres`), README badge (PR #1) |
| `ws1-start` / `ws1-done` | jonli panel: socket.io gateway, `order-changed`, `/admin`, `npm run live` |
| `ws2-start` / `ws2-done` | qayta ulanish: panel va `npm run live` har `connect` da ro'yxatni qayta so'raydi; `BUZISH.md` |
| `wh-start` / `wh-done` | to'lov webhook'i: `POST /payments/webhook` (imzo, takror, rad), `payments` jadvali, panelda «To'lov», `npm run pay` |

Mentor darsi `tgpg-start` dan boshlanadi: `git checkout tgpg-start`. Oxirida o'z natijangizni `tgpg-done` bilan solishtirasiz.

## Xatolar

| Terminalda | Sabab | Yechim |
|---|---|---|
| `BOT_TOKEN topilmadi` | `.env` yo'q yoki bo'sh | `.env.example` dan nusxa, token yozing |
| `DATABASE_URL topilmadi` | `.env` da baza manzili yo'q | `postgresql://postgres:parol@localhost:5432/shop` |
| `database "shop" does not exist` | baza ochilmagan | psql: `CREATE DATABASE shop;` |
| `password authentication failed` | parol noto'g'ri | PG-1 da qo'ygan parolingiz |
| `Telegram ulanmadi: 401: Unauthorized` | token noto'g'ri; server ishlayveradi, bot jim | @BotFather dan tokenni qayta oling |
| `409: Conflict: terminated by other getUpdates request` | shu token bilan ikkinchi nusxa ishlayapti | eski jarayonni to'xtating |
| `violates check constraint "stock_nonneg"` | qoldiqdan ko'p sotilmoqchi | kod avval qoldiqni tekshiradi; bu bazadagi oxirgi qo'riqchi |
| `connect_error: xhr poll error` (panel «Ulanmoqda…») | server ishlamayapti yoki manzil/port noto'g'ri; klient o'zi qayta urinadi | serverni yoqing — panel o'zi ulanadi |
| `disconnect: io server disconnect` (panel «Ulanmagan») | token noto'g'ri yoki bo'sh — server ulanishni yopdi | `.env` dagi `ADMIN_PANEL_TOKEN` ni kiriting |
| `disconnect: ping timeout` | ~45 s javob yo'q (internet uzildi, server qotdi) | o'zi qayta ulanadi; doimiy bo'lsa — tarmoqni tekshiring |
| belgi «Ulangan», lekin yangi buyurtma ro'yxatda yo'q (bazada bor) | qayta ulanishdan oldin yuborilgan hodisa kelmaydi; panel `connect` da qayta so'ramayapti | `ws2-done`: `connect` ichida `yukla()` |
| bitta buyurtmaga bir nechta `GET /admin/orders` (F12 → Network), sariq belgi yo'qoladi | `order-changed` tinglovchisi `connect` ichida — har qayta ulanishda yana bittasi | tinglovchini `connect` dan tashqariga, bir marta |
| `GET /admin/orders` → 401 | `Authorization: Bearer <token>` yo'q yoki noto'g'ri | panel o'zi yuboradi; curl'da sarlavhani qo'shing |
| `POST /payments/webhook` → 401 | imzo yo'q/noto'g'ri, `PAYMENT_WEBHOOK_SECRET` bo'sh yoki xizmatdagidan farq qiladi, yoki server `rawBody` siz | `.env` dagi kalit; `main.ts` da `rawBody: true` |
| `POST /payments/webhook` → 400 `summa mos emas` | xabardagi `amount` buyurtma `total` iga teng emas | xizmatga yuborilgan summani tekshiring |
| `Cannot POST /payments/webhook` (404) | `wh-start` — webhook hali yo'q | `git checkout wh-done` |
| `current transaction is aborted` | tranzaksiya ichida xato chiqdi, keyin yana so'rov yuborildi | xatodan keyin faqat ROLLBACK; tekshiruvni UPDATE'dan oldin qiling |