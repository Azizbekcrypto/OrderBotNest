// npm run pay -- <buyurtma raqami> [ok | rad | ikki | imzosiz | soxta]
// Soxta to'lov xizmati: haqiqiy xizmat qiladigan ishni qiladi — to'lov natijasini imzolab POST /payments/webhook ga yuboradi.
// Summa buyurtmaning o'zidan olinadi (GET /admin/orders, ADMIN_PANEL_TOKEN bilan). Kalit — .env dagi PAYMENT_WEBHOOK_SECRET.
//   ok      — to'landi (paid)
//   rad     — rad etildi (failed)
//   ikki    — bitta xabar ikki marta (javob yo'qolgandagi kabi) — ikkinchisi takror
//   imzosiz — X-Signature sarlavhasisiz
//   soxta   — boshqa kalit bilan imzolangan (kalitni bilmagan odam)
const path = require('path');
const { createHmac, randomBytes } = require('crypto');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true,
});

const url =
  process.env.PAY_URL || `http://localhost:${process.env.PORT || 3000}`;
const [id, mode = 'ok'] = process.argv.slice(2);
const secret = process.env.PAYMENT_WEBHOOK_SECRET || '';
const MODES = ['ok', 'rad', 'ikki', 'imzosiz', 'soxta'];
if (!Number.isInteger(Number(id)) || !MODES.includes(mode)) {
  console.log(
    `ishlatish: npm run pay -- <buyurtma raqami> [${MODES.join(' | ')}]`,
  );
  process.exit(1);
}
const sign = (body, key) =>
  createHmac('sha256', key).update(body).digest('hex');

async function send(body, signature) {
  const headers = { 'Content-Type': 'application/json' };
  if (signature) headers['X-Signature'] = signature;
  const r = await fetch(`${url}/payments/webhook`, {
    method: 'POST',
    headers,
    body,
  });
  console.log(`← ${r.status} ${await r.text()}`);
}

(async () => {
  const r = await fetch(`${url}/admin/orders`, {
    headers: { Authorization: `Bearer ${process.env.ADMIN_PANEL_TOKEN}` },
  });
  if (!r.ok) {
    console.log(
      `GET /admin/orders → ${r.status} (.env dagi ADMIN_PANEL_TOKEN?)`,
    );
    process.exit(1);
  }
  const order = (await r.json()).find((o) => o.id === Number(id));
  if (!order) {
    console.log(`#${id} oxirgi 20 buyurtma ichida yo'q`);
    process.exit(1);
  }
  const body = JSON.stringify({
    paymentId: `pay_${randomBytes(4).toString('hex')}`,
    orderId: order.id,
    status: mode === 'rad' ? 'failed' : 'paid',
    amount: order.total,
  });
  const signature =
    mode === 'imzosiz'
      ? ''
      : sign(body, mode === 'soxta' ? 'boshqa-kalit' : secret);
  console.log(`→ POST /payments/webhook ${body}`);
  console.log(
    `  X-Signature: ${signature ? signature.slice(0, 16) + '…' : "(yo'q)"}`,
  );
  await send(body, signature);
  if (mode === 'ikki') {
    console.log(
      '→ xuddi shu xabar yana (xizmat javobni olmagan deb qayta yubordi)',
    );
    await send(body, signature);
  }
})().catch((e) => {
  console.log(`xato: ${e.message} — server ishlayaptimi? (${url})`);
  process.exit(1);
});
