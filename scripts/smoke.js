// npm run smoke [-- restart | race | live]
// Botni Telegram'siz sinaydi: haqiqiy Nest + Telegraf kodi, xabar bot.handleUpdate bilan beriladi,
// botning javobi ushlanadi (Telegram'ga hech qanday so'rov ketmaydi).
// Bazangiz o'zgarmaydi: smoke vaqtinchalik <baza>_smoke bazasini ochadi va oxirida o'chiradi.
//   restart — savat, buyurtma va telefon kutish server qayta ishga tushganda qoladimi
//   race    — omborda 1 ta Planshet, ikki mijoz bir vaqtda buyurtma beradi; admin ikki marta bekor qiladi
//   live    — jonli panel: tokensiz ulanish yopiladimi, buyurtma va holat o'zgarishi order-changed bo'lib keladimi
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, '.env'), quiet: true });
const MODE = process.argv[2] || 'all';
const ADMIN = 111;
const AZIZA = 5123456789; // 32 bitdan katta — Telegram'da bunday id bor
const BOBUR = 5987654321;
const NAME = { [ADMIN]: 'Jasur', [AZIZA]: 'Aziza', [BOBUR]: 'Bobur' };

process.env.BOT_TOKEN = '123:SMOKE';
process.env.ADMIN_TELEGRAM_IDS = String(ADMIN);
const PANEL_TOKEN = 'smoke-panel';
process.env.ADMIN_PANEL_TOKEN = PANEL_TOKEN;
process.env.DB_LOGGING = 'false';

const results = [];
const check = (ok, text) => {
  results.push(ok);
  console.log(`  ${ok ? '✓' : '✗'} ${text}`);
};

// ---------- Telegram o'rniga ----------
const { Telegraf, Telegram } = require('telegraf');
Telegraf.prototype.launch = async function (cb) {
  if (cb) cb();
};
const inbox = []; // { to, text }
let mid = 1000;
Telegram.prototype.callApi = async function (method, p = {}) {
  if (method === 'sendMessage' || method === 'editMessageText') {
    inbox.push({ to: Number(p.chat_id), text: String(p.text) });
    return {
      message_id: ++mid,
      chat: { id: p.chat_id },
      date: 0,
      text: p.text,
    };
  }
  if (method === 'answerCallbackQuery') {
    if (p.text) inbox.push({ to: 0, text: String(p.text) });
    return true;
  }
  return true;
};

// ---------- vaqtinchalik baza ----------
let pg = null;
try {
  pg = require('pg');
} catch {
  /* tgpg-start: baza yo'q */
}
const baseUrl = process.env.SMOKE_DB_URL || process.env.DATABASE_URL || '';
const hasDb = Boolean(pg && baseUrl);
let smokeUrl = '';
async function adminQuery(sql) {
  const u = new URL(baseUrl);
  u.pathname = '/postgres';
  const c = new pg.Client({
    connectionString: u.toString(),
    ssl: baseUrl.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
  });
  await c.connect();
  try {
    await c.query(sql);
  } finally {
    await c.end();
  }
}
async function q(sql, params) {
  const c = new pg.Client({
    connectionString: smokeUrl,
    ssl: smokeUrl.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
  });
  await c.connect();
  try {
    return (await c.query(sql, params)).rows;
  } finally {
    await c.end();
  }
}
async function setupDb() {
  const u = new URL(baseUrl);
  const db = `${u.pathname.slice(1) || 'shop'}_smoke`;
  await adminQuery(`DROP DATABASE IF EXISTS "${db}"`);
  await adminQuery(`CREATE DATABASE "${db}" TEMPLATE template0`);
  u.pathname = `/${db}`;
  smokeUrl = u.toString();
  process.env.DATABASE_URL = smokeUrl;
  return db;
}

// ---------- bot ----------
const { NestFactory } = require('@nestjs/core');
const dist = (p) => require(path.join(ROOT, 'dist', p));
let uid = 1;
// http=true — haqiqiy HTTP server (tasodifiy port): /admin va WebSocket shu portda; aks holda — faqat Nest konteksti
async function boot(http = false) {
  const { AppModule } = dist('api/app.module');
  const { TelegramService } = dist('api/telegram/telegram.service');
  const app = http
    ? await NestFactory.create(AppModule, { logger: ['error'] })
    : await NestFactory.createApplicationContext(AppModule, {
        logger: ['error'],
      });
  if (http) await app.listen(0);
  const bot = app.get(TelegramService).bot;
  const from = (id) => ({ id, is_bot: false, first_name: NAME[id] });
  const chat = (id) => ({ id, type: 'private' });
  const say = (id, text) => {
    const m = text.match(/^\/\w+/);
    return bot.handleUpdate({
      update_id: uid++,
      message: {
        message_id: ++mid,
        from: from(id),
        chat: chat(id),
        date: 0,
        text,
        entities: m
          ? [{ type: 'bot_command', offset: 0, length: m[0].length }]
          : undefined,
      },
    });
  };
  const tap = (id, data) =>
    bot.handleUpdate({
      update_id: uid++,
      callback_query: {
        id: String(uid),
        from: from(id),
        chat_instance: '1',
        data,
        message: {
          message_id: mid,
          from: { id: 1, is_bot: true, first_name: 'bot' },
          chat: chat(id),
          date: 0,
          text: '…',
        },
      },
    });
  const port = http ? app.getHttpServer().address().port : 0;
  return { app, say, tap, port };
}
const last = (id) => [...inbox].reverse().find((m) => m.to === id)?.text || '';
const productId = async (name) =>
  (await q('SELECT id FROM products WHERE name = $1', [name]))[0]?.id;

// restart: har qadam — ALOHIDA node jarayoni (haqiqiy restart: RAM ham, modul darajasidagi o'zgaruvchilar ham yangidan)
async function step(n) {
  const { app, say, tap } = await boot();
  const out = {};
  if (n === 1) {
    await say(AZIZA, '/start');
    await tap(AZIZA, 'add:1');
    await tap(AZIZA, 'checkout');
    out.asked = last(AZIZA);
  } else if (n === 2) {
    await say(AZIZA, '+998901234567');
    out.placed = last(AZIZA);
    await tap(AZIZA, 'add:2');
  } else {
    await say(AZIZA, '/cart');
    out.cart = last(AZIZA);
    await say(ADMIN, '/start');
    await say(ADMIN, '/orders');
    out.orders = last(ADMIN);
  }
  await app.close();
  console.log('SMOKE_STEP ' + JSON.stringify(out));
}
function runStep(n) {
  const env = { ...process.env, SMOKE_DB_URL: smokeUrl };
  const txt = execSync(`node "${__filename}" __step ${n}`, {
    cwd: ROOT,
    env,
    encoding: 'utf8',
  });
  const line = txt.split('\n').find((l) => l.startsWith('SMOKE_STEP '));
  return JSON.parse(line.slice('SMOKE_STEP '.length));
}
async function restartMode() {
  console.log(
    '\n— restart: har qadam alohida jarayonda (server haqiqatan qayta ishga tushadi)',
  );
  const s1 = runStep(1);
  const s2 = runStep(2);
  const ok1 = /telefon/i.test(s1.asked) && /qabul qilindi/i.test(s2.placed);
  check(ok1, `telefon kutish restartdan o'tdi → «${s2.placed.split('\n')[0]}»`);
  const s3 = runStep(3);
  check(
    /Sichqoncha/.test(s3.cart),
    `savat restartdan o'tdi → «${s3.cart.split('\n')[0]}»`,
  );
  check(
    /#\d+ · Aziza/.test(s3.orders),
    `buyurtma restartdan o'tdi → «${s3.orders.split('\n')[0]}»`,
  );
}

async function raceMode() {
  console.log(
    '\n— race: 1 ta Planshet, 5 mijoz bir vaqtda (3 raund); keyin ikki marta bekor',
  );
  if (!hasDb) {
    console.log('  (baza ulanmagan — race faqat PostgreSQL bilan sinaladi)');
    return;
  }
  // Ikki mijoz yetmaydi: tranzaksiya tez tugaydi va xato ko'pincha ko'rinmaydi. 5 mijoz, 3 raund.
  const BUYERS = [5100000001, 5100000002, 5100000003, 5100000004, 5100000005];
  BUYERS.forEach((id, i) => (NAME[id] = `Mijoz${i + 1}`));
  const { app, say, tap } = await boot();
  for (const id of BUYERS) await say(id, '/start');
  await q(
    "UPDATE users SET phone = '+998900000000' WHERE telegram_id = ANY($1)",
    [BUYERS.map(String)],
  );
  const pid = await productId('Planshet');
  const rounds = [];
  let winnerOrder = null;
  for (let r = 0; r < 3; r++) {
    await q('UPDATE products SET stock = 1 WHERE id = $1', [pid]);
    await q('DELETE FROM cart_items');
    for (const id of BUYERS) await tap(id, `add:${pid}`);
    inbox.length = 0;
    await Promise.all(BUYERS.map((id) => tap(id, 'checkout')));
    const ok = inbox.filter((m) => m.to !== 0 && /qabul qilindi/i.test(m.text));
    const stock = (
      await q('SELECT stock FROM products WHERE id = $1', [pid])
    )[0].stock;
    rounds.push({ sold: ok.length, stock: Number(stock) });
    if (!winnerOrder && ok[0]) winnerOrder = ok[0].text.match(/#(\d+)/)?.[1];
  }
  const refused = [...inbox].reverse().find((m) => /berilmadi/i.test(m.text));
  if (refused)
    console.log(`  rad etilgan mijoz: «${refused.text.split('\n')[0]}»`);
  const allOk = rounds.every((x) => x.sold === 1 && x.stock === 0);
  check(
    allOk,
    `ortiqcha sotilmadi (sotildi/ombor): ${rounds.map((x) => `${x.sold}/${x.stock}`).join('  ')}`,
  );
  if (winnerOrder) {
    await q('UPDATE products SET stock = 0 WHERE id = $1', [pid]);
    await say(ADMIN, '/start');
    await Promise.all([
      tap(ADMIN, `status:${winnerOrder}:CANCELLED`),
      tap(ADMIN, `status:${winnerOrder}:CANCELLED`),
    ]);
    const s2 = (await q('SELECT stock FROM products WHERE id = $1', [pid]))[0]
      .stock;
    check(
      Number(s2) === 1,
      `ikki marta bir vaqtda bekor — ombor bir marta qaytdi: 0 → ${s2}`,
    );
  }
  await app.close();
}

// live: panel nima ko'radi — haqiqiy HTTP server, socket.io-client (panel ham shuni ishlatadi)
async function liveMode() {
  console.log(
    "\n— live: jonli panel — tokensiz ulanish, yangi buyurtma va holat o'zgarishi",
  );
  if (!hasDb) {
    console.log('  (baza ulanmagan — live faqat PostgreSQL bilan sinaladi)');
    return;
  }
  let connectIo;
  try {
    ({ io: connectIo } = require('socket.io-client'));
  } catch {
    console.log("  (socket.io-client yo'q — jonli panel hali qo'shilmagan)");
    return;
  }
  const { app, say, tap, port } = await boot(true);
  const url = `http://localhost:${port}`;
  // hodisani kutish: kelmasa 3 s dan keyin null
  const wait = (c, ev) =>
    new Promise((ok) => {
      const tm = setTimeout(() => ok(null), 3000);
      c.once(ev, (x) => {
        clearTimeout(tm);
        ok(x === undefined ? true : x);
      });
    });
  const bad = connectIo(url, { auth: {}, reconnection: false });
  const reason = await wait(bad, 'disconnect');
  check(
    reason === 'io server disconnect',
    `tokensiz ulanish — server yopdi: ${reason}`,
  );
  bad.close();
  const c = connectIo(url, {
    auth: { token: PANEL_TOKEN },
    reconnection: false,
  });
  await wait(c, 'connect');
  const ev1 = wait(c, 'order-changed');
  await say(BOBUR, '/start');
  await tap(BOBUR, 'add:1');
  await tap(BOBUR, 'checkout');
  await say(BOBUR, '+998907654321');
  const e1 = await ev1;
  check(
    Boolean(e1) && e1.reason === 'new',
    `yangi buyurtma → order-changed ${JSON.stringify(e1)}`,
  );
  const res = await fetch(`${url}/admin/orders`, {
    headers: { Authorization: `Bearer ${PANEL_TOKEN}` },
  });
  const list = res.ok ? await res.json() : [];
  check(
    res.status === 200 && Boolean(e1) && list[0]?.id === e1.orderId,
    `GET /admin/orders ${res.status} — eng yuqorida #${list[0]?.id} · ${list[0]?.customer}`,
  );
  if (e1) {
    const ev2 = wait(c, 'order-changed');
    await say(ADMIN, '/start');
    await tap(ADMIN, `status:${e1.orderId}:CONFIRMED`);
    const e2 = await ev2;
    check(
      Boolean(e2) && e2.reason === 'status' && e2.orderId === e1.orderId,
      `admin tasdiqladi → order-changed ${JSON.stringify(e2)}`,
    );
  }
  c.close();
  await app.close();
}

(async () => {
  if (process.argv[2] === '__step') {
    if (process.env.SMOKE_DB_URL) {
      smokeUrl = process.env.SMOKE_DB_URL;
      process.env.DATABASE_URL = smokeUrl;
    }
    await step(Number(process.argv[3]));
    process.exit(0);
  }
  console.log('== build ==');
  execSync('npx nest build', { cwd: ROOT, stdio: 'inherit' });
  if (hasDb) {
    const db = await setupDb();
    console.log(`== vaqtinchalik baza: ${db} ==`);
    // migratsiyalar server ko'tarilganda o'zi yuradi; katalogni seed to'ldiradi
    const { app } = await boot();
    await app.close();
    try {
      execSync('npm run -s seed', {
        cwd: ROOT,
        stdio: 'pipe',
        env: process.env,
      });
    } catch {
      /* seed yo'q bo'lsa — mahsulotlar migratsiya ichida bo'lishi mumkin */
    }
    const n = (await q('SELECT count(*)::int AS n FROM products'))[0].n;
    console.log(`  katalogda ${n} ta mahsulot`);
  } else {
    console.log("== baza yo'q: hammasi xotirada (tgpg-start) ==");
  }
  try {
    if (MODE === 'all' || MODE === 'restart') await restartMode();
    if (MODE === 'all' || MODE === 'race') await raceMode();
    if (MODE === 'all' || MODE === 'live') await liveMode();
  } finally {
    if (hasDb) {
      const db = new URL(smokeUrl).pathname.slice(1);
      await adminQuery(`DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`).catch(
        () => undefined,
      );
    }
  }
  const ok = results.filter(Boolean).length;
  console.log(`\nNATIJA: ${ok}/${results.length} ✓`);
  process.exit(ok === results.length ? 0 : 1);
})().catch((e) => {
  console.error('\nSMOKE XATO:', e.message);
  process.exit(2);
});
