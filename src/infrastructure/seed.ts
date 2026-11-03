import { AppDataSource } from './data-source';
import { Product } from '../core/entity';

// npm run seed — katalogni to'ldiradi (bor bo'lsa tegmaydi)
const PRODUCTS = [
  { name: 'Klaviatura', price: 120000, stock: 8 },
  { name: 'Sichqoncha', price: 75000, stock: 15 },
  { name: 'Quloqchin', price: 95000, stock: 5 },
  { name: 'Mishka', price: 50000, stock: 10 },
  { name: 'Planshet', price: 300000, stock: 3 },
  { name: "O'yinchoq", price: 30000, stock: 4 },
];

async function seed() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  const result = await AppDataSource.createQueryBuilder()
    .insert()
    .into(Product)
    .values(PRODUCTS)
    .orIgnore() // ON CONFLICT DO NOTHING — nomi bor bo'lsa o'tkazib yuboradi
    .execute();
  console.log(`Seed: ${result.raw.length} ta mahsulot qo'shildi`);
  await AppDataSource.destroy();
}

void seed();
