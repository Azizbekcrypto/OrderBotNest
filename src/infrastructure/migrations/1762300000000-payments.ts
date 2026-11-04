import { MigrationInterface, QueryRunner } from 'typeorm';

// To'lov xabarlari: har xabar — bitta qator. payment_id NOYOB — xizmat bitta xabarni ikki marta yuborsa,
// ikkinchisi yozilmaydi (takror). orders.payment_status — panelda ko'rinadigan oxirgi holat.
export class Payments1762300000000 implements MigrationInterface {
  name = 'Payments1762300000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE "payments" (
      "id" SERIAL PRIMARY KEY,
      "payment_id" VARCHAR NOT NULL UNIQUE,
      "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
      "status" VARCHAR NOT NULL CHECK ("status" IN ('paid', 'failed')),
      "amount" INTEGER NOT NULL,
      "created_at" TIMESTAMP NOT NULL DEFAULT now()
    )`);
    await q.query(`ALTER TABLE "orders" ADD COLUMN "payment_status" VARCHAR`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "orders" DROP COLUMN "payment_status"`);
    await q.query(`DROP TABLE "payments"`);
  }
}
