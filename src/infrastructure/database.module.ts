import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from '../config';
import { dataSourceOptions } from './data-source';

if (!config.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL topilmadi. .env ga PostgreSQL manzilini yozing: postgresql://postgres:parol@localhost:5432/shop',
  );
}

// Bazaga bitta joyda ulanamiz; server ko'tarilganda migratsiyalar o'zi yuradi
@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...(dataSourceOptions as object),
      migrationsRun: true,
    }),
  ],
})
export class DatabaseModule {}
