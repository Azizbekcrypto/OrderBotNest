import { Injectable } from '@nestjs/common';
import { Product } from '../../core/types';

export const PAGE_SIZE = 2;

// Katalog hozircha koddagi ro'yxat. Narx so'mda, stock — omborda nechta.
const PRODUCTS: Product[] = [
  { id: 1, name: 'Klaviatura', price: 120000, stock: 8 },
  { id: 2, name: 'Sichqoncha', price: 75000, stock: 15 },
  { id: 3, name: 'Quloqchin', price: 95000, stock: 5 },
  { id: 4, name: 'Mishka', price: 50000, stock: 10 },
  { id: 5, name: 'Planshet', price: 300000, stock: 3 },
  { id: 6, name: "O'yinchoq", price: 30000, stock: 4 },
];

@Injectable()
export class CatalogService {
  all(): Product[] {
    return PRODUCTS;
  }

  // page 0 dan boshlanadi; qaytaradi: shu sahifa mahsulotlari va jami sahifa soni
  page(page: number): { items: Product[]; pages: number } {
    const pages = Math.ceil(PRODUCTS.length / PAGE_SIZE);
    const start = Math.min(Math.max(page, 0), pages - 1) * PAGE_SIZE;
    return { items: PRODUCTS.slice(start, start + PAGE_SIZE), pages };
  }

  find(id: number): Product | undefined {
    return PRODUCTS.find((p) => p.id === id);
  }

  // Ombordan ayiradi; yetmasa xato tashlaydi (buyurtma berilmaydi)
  take(id: number, qty: number): Product {
    const p = this.find(id);
    if (!p) throw new Error(`Mahsulot topilmadi: ${id}`);
    if (p.stock < qty) {
      throw new Error(`${p.name}: omborda faqat ${p.stock} ta qoldi`);
    }
    p.stock -= qty;
    return p;
  }

  // Bekor qilingan buyurtma — mahsulot omborga qaytadi
  giveBack(id: number, qty: number): void {
    const p = this.find(id);
    if (p) p.stock += qty;
  }
}
