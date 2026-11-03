import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { CartItem, Order, OrderItem, Product, User } from '../core/entity';
import { Init1762200000000 } from './migrations/1762200000000-init';

// Bitta ulanish sozlamasi — ham Nest (DatabaseModule), ham typeorm CLI (migration:run) shuni ishlatadi
export const dataSourceOptions = {
  type: 'postgres' as const,
  url: config.DATABASE_URL,
  ssl: config.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
  entities: [Product, User, CartItem, Order, OrderItem],
  migrations: [Init1762200000000],
  synchronize: false, // jadvallar faqat migratsiya bilan o'zgaradi
  logging: config.DB_LOGGING ? ['query', 'error'] : ['error'],
};

export const AppDataSource = new DataSource(dataSourceOptions as never);
