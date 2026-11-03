import { MigrationInterface, QueryRunner } from 'typeorm';

// Birinchi migratsiya: beshta jadval. SQL — PG-2 darsidagi buyruqlarning o'zi.
export class Init1762200000000 implements MigrationInterface {
  name = 'Init1762200000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE "products" (
      "id" SERIAL PRIMARY KEY,
      "name" VARCHAR NOT NULL UNIQUE,
      "price" INTEGER NOT NULL,
      "stock" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "stock_nonneg" CHECK ("stock" >= 0)
    )`);
    await q.query(`CREATE TABLE "users" (
      "id" SERIAL PRIMARY KEY,
      "telegram_id" BIGINT NOT NULL UNIQUE,
      "name" VARCHAR NOT NULL,
      "phone" VARCHAR,
      "role" VARCHAR NOT NULL DEFAULT 'customer',
      "state" VARCHAR NOT NULL DEFAULT 'IDLE',
      "created_at" TIMESTAMP NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE TABLE "cart_items" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
      "qty" INTEGER NOT NULL DEFAULT 1 CHECK ("qty" > 0),
      CONSTRAINT "cart_one_row_per_product" UNIQUE ("user_id", "product_id")
    )`);
    await q.query(`CREATE TABLE "orders" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
      "phone" VARCHAR NOT NULL,
      "total" INTEGER NOT NULL,
      "status" VARCHAR NOT NULL DEFAULT 'NEW',
      "created_at" TIMESTAMP NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE TABLE "order_items" (
      "id" SERIAL PRIMARY KEY,
      "order_id" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
      "qty" INTEGER NOT NULL CHECK ("qty" > 0),
      "price" INTEGER NOT NULL
    )`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "order_items"`);
    await q.query(`DROP TABLE "orders"`);
    await q.query(`DROP TABLE "cart_items"`);
    await q.query(`DROP TABLE "users"`);
    await q.query(`DROP TABLE "products"`);
  }
}
