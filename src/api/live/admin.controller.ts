import {
  Controller,
  Get,
  Header,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { OrderService } from '../order/order.service';
import { isAdminToken } from './admin-token';

@Controller('admin')
export class AdminController {
  constructor(private readonly orders: OrderService) {}

  // Panel sahifasi: http://localhost:3000/admin — oddiy HTML. Tokenni sahifa so'raydi va brauzerda saqlaydi.
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  page(): string {
    return readFileSync(join(process.cwd(), 'public', 'admin.html'), 'utf8');
  }

  // Panel shu ro'yxatni ochilganda va har order-changed hodisasidan keyin so'raydi.
  // Token sarlavhada: Authorization: Bearer <ADMIN_PANEL_TOKEN>
  @Get('orders')
  async list(@Headers('authorization') auth?: string) {
    const token = (auth ?? '').replace(/^Bearer /, '');
    if (!isAdminToken(token))
      throw new UnauthorizedException("Token noto'g'ri");
    const orders = await this.orders.recent(20);
    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      customer: o.user?.name ?? '',
      phone: o.phone,
      items: o.items.map((i) => ({ name: i.product.name, qty: i.qty })),
      created_at: o.created_at,
    }));
  }
}
