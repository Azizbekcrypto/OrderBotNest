import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { config } from '../../config';
import { OrderService } from '../order/order.service';
import { AdminController } from './admin.controller';

// Baza o'rniga mock: recent() bitta buyurtma qaytaradi
const order = {
  id: 12,
  status: 'NEW',
  payment_status: 'paid',
  total: 100000,
  phone: '+998901234567',
  user: { name: 'Aziza' },
  items: [{ product: { name: 'Kolonka' }, qty: 2 }],
  created_at: new Date('2026-11-04T10:00:00Z'),
};

describe('AdminController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    config.ADMIN_PANEL_TOKEN = 'sinov-token';
    const mod = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: OrderService,
          useValue: { recent: jest.fn(async () => [order]) },
        },
      ],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /admin/orders tokensiz — 401', async () => {
    const res = await request(app.getHttpServer()).get('/admin/orders');
    expect(res.status).toBe(401);
  });

  it("GET /admin/orders noto'g'ri token — 401", async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/orders')
      .set('Authorization', 'Bearer notogri');
    expect(res.status).toBe(401);
  });

  it("GET /admin/orders token bilan — 200 va ro'yxat", async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/orders')
      .set('Authorization', 'Bearer sinov-token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 12,
        status: 'NEW',
        payment: 'paid',
        total: 100000,
        customer: 'Aziza',
        phone: '+998901234567',
        items: [{ name: 'Kolonka', qty: 2 }],
        created_at: '2026-11-04T10:00:00.000Z',
      },
    ]);
  });

  it('GET /admin — panel sahifasi (socket.io klienti bilan)', async () => {
    const res = await request(app.getHttpServer()).get('/admin');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('/socket.io/socket.io.js');
  });
});
