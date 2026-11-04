// npm run live [-- <token>]
// Terminal klienti: jonli panel nima ko'rsa — shu yerda satr bo'lib chiqadi (brauzer kerak emas).
// Manzil: LIVE_URL yoki http://localhost:<PORT>. Token: buyruqdagi argument yoki .env dagi ADMIN_PANEL_TOKEN.
//   npm run live                  — .env dagi token bilan
//   npm run live -- notogri       — noto'g'ri token bilan (server ulanishni yopadi)
//   npm run live -- ""            — tokensiz
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true,
});
const { io } = require('socket.io-client');

const url =
  process.env.LIVE_URL || `http://localhost:${process.env.PORT || 3000}`;
const token =
  process.argv.length > 2 ? process.argv[2] : process.env.ADMIN_PANEL_TOKEN;
const t = () => new Date().toTimeString().slice(0, 8);
const holat = (s) =>
  s.connected ? 'ulangan' : s.active ? 'ulanmoqda' : 'ulanmagan';

const s = io(url, { auth: { token } });
console.log(`${t()} ulanmoqda… ${url}`);
// Panel kabi: har connect'da (birinchi va qayta) ro'yxat qayta so'raladi — uzilish paytidagi hodisa kelmaydi
async function royxat() {
  const r = await fetch(`${url}/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return console.log(`${t()} GET /admin/orders → ${r.status}`);
  const list = await r.json();
  console.log(
    `${t()} GET /admin/orders → ${list.length} ta` +
      (list.length ? `, eng yangisi #${list[0].id}` : ''),
  );
}
s.on('connect', () => {
  console.log(
    `${t()} connect · ${holat(s)} · transport: ${s.io.engine.transport.name}`,
  );
  s.io.engine.once('upgrade', (tr) =>
    console.log(`${t()} transport: ${tr.name}`),
  );
  royxat().catch((e) => console.log(`${t()} GET xato: ${e.message}`));
});
s.on('disconnect', (reason) =>
  console.log(
    `${t()} disconnect: ${reason} · active=${s.active} → ${holat(s)}`,
  ),
);
s.on('connect_error', (e) =>
  console.log(
    `${t()} connect_error: ${e.message} · active=${s.active} → ${holat(s)}`,
  ),
);
s.on('order-changed', (p) =>
  console.log(`${t()} order-changed ${JSON.stringify(p)}`),
);
