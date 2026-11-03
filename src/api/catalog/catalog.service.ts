import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../core/entity';

export const PAGE_SIZE = 2;

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  all(): Promise<Product[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  // page 0 dan boshlanadi: SELECT ... ORDER BY id LIMIT 2 OFFSET page*2
  async page(page: number): Promise<{ items: Product[]; pages: number }> {
    const count = await this.repo.count();
    const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    const safe = Math.min(Math.max(page, 0), pages - 1);
    const items = await this.repo.find({
      order: { id: 'ASC' },
      skip: safe * PAGE_SIZE,
      take: PAGE_SIZE,
    });
    return { items, pages };
  }

  find(id: number): Promise<Product | null> {
    return this.repo.findOneBy({ id });
  }
}
