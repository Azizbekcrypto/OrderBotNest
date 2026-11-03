import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const config = {
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: String(process.env.DATABASE_URL || ''),
  // true bo'lsa TypeORM har SQL so'rovni terminalga yozadi — o'rganish uchun
  DB_LOGGING: process.env.DB_LOGGING === 'true',
  BOT_TOKEN: String(process.env.BOT_TOKEN || ''),
  // "123,456" → [123, 456]
  ADMIN_TELEGRAM_IDS: String(process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number),
};
