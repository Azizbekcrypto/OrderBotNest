# Buzish yozuvi

Mahsulot: OrderBotNest — jonli buyurtmalar paneli (`/admin`). Da'vo — README «Jonli panel»: «ro'yxat o'zi yangilanadi» (`ws2-start` = `ws1-done`).
Har urinish: nima qildim · nima kutdim · nima bo'ldi → belgi. Brauzer — Chrome; «Bobur» — sinov mijozi (Telegram o'rniga `bot.handleUpdate`, `npm run smoke` dagi usul), baza — haqiqiy PostgreSQL.

| № | Usul | Nima qildim | Nima kutdim | Nima bo'ldi | Belgi | Tuzatish | Qayta tekshiruv |
|---|---|---|---|---|---|---|---|
| 1 | Server qayta ishga tushdi | Panel ochiq, ro'yxatda #1. Server terminalida Ctrl+C; server o'chiq paytda Bobur botga yozdi; serverni qayta yoqdim — bot ishga tushishi bilan xabarni bajardi (#2). | Belgi «Ulangan» bo'lgach ro'yxatda #2. | Belgi «Ulangan», ro'yxatda faqat #1; bazada 2 ta. `npm run live` da ham `order-changed` kelmadi. | buzildi | tuzatish qilindi | qayta tekshiruvda takrorlanmadi |
| 2 | Brauzer Offline, qisqa | DevTools → Network → Offline, ~6 s; shu payt Bobur buyurtma berdi; Offline'ni o'chirdim. | Online'dan keyin ro'yxatda yangi buyurtma. | Belgi o'zgarmadi («Ulangan»); hodisa Online bo'lgan zahoti keldi, ro'yxat yangilandi. | buzilmadi | — | — |
| 3 | Brauzer Offline, uzoq | Offline ~60 s (33-soniyada belgi «Ulanmoqda…»); shu payt Bobur buyurtma berdi; Offline'ni o'chirdim. | Belgi «Ulangan» bo'lgach ro'yxatda yangi buyurtma. | Belgi «Ulangan», ro'yxatda yo'q; bazada bor. | buzildi | tuzatish qilindi | qayta tekshiruvda takrorlanmadi |

«buzilmadi» (2-urinish) — shu kompyuterda, shu urinishda.

## Topilgan muammo va tuzatish

1. **Uzilishdan keyin yangi buyurtma ko'rinmaydi** (1 va 3-urinish). Sabab: `order-changed` faqat hozir ulangan panellarga yuboriladi; ulanish yo'q paytdagi hodisa qayta ulangach kelmaydi. 1-urinishda bot Telegram navbatidagi xabarni panel qayta ulanishidan oldin bajardi (panel 1–5 s da qayta urinadi).
   Tuzatish (`public/admin.html`): `connect` ichida `yukla()` — birinchi va har qayta ulanishda ro'yxat `GET /admin/orders` dan qayta so'raladi; Kirish va sahifa ochilishidagi alohida `yukla()` olib tashlandi (ro'yxat ikki joyda: `connect` va `order-changed`). `scripts/live-client.js` ham har `connect` da `GET /admin/orders → N ta` chiqaradi.

Server kodi o'zgarmagan.

## Tuzatishda tuzoq

`order-changed` tinglovchisini ham `connect` ichiga ko'chirsa, har qayta ulanishda yana bittasi qo'shiladi: ikki qayta yonishdan keyin bitta buyurtmaga 3 ta `GET`, sariq belgi yo'qoladi. Tinglovchi bir marta, `connect` dan tashqarida.

## `connectionStateRecovery` haqida

Sinab ko'rildi (`@WebSocketGateway({ connectionStateRecovery: … })`): tarmoq qisqa uzilganda o'tkazilgan hodisa qayta keladi (`socket.recovered = true`), lekin server qayta yonganda (holat server xotirasida) va klient uzilishdan oldin birorta hodisa olmagan bo'lsa — yo'q. Eng ko'p holat — server qayta yonishi (deploy, xato), shuning uchun yoqilmadi: `connect` da qayta so'rash yetadi.

«Tuzatish qilindi» — kodda o'zgartirish qilindi (ish fakti). «Qayta tekshiruvda takrorlanmadi» — o'sha usul bilan qayta buzib ko'rilgan natija: shu kompyuterda, shu urinishda — hamma holat uchun isbot emas.
