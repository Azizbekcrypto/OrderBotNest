import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { config } from '../../config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { sign } from './signature';

// Baza o'rniga mock servis. App rawBody: true bilan — main.ts dagi kabi
const KEY = 'sinov-kalit';
const record = jest.fn(async () => ({ duplicate: false }));
const body = JSON.stringify({
  paymentId: 'pay_1',
  orderId: 5,
  status: 'paid',
  amount: 120000,
});

describe('PaymentController — POST /payments/webhook', () => {
  let app: INestApplication;
  const post = (b: string, sig?: string) => {
    const r = request(app.getHttpServer())
      .post('/payments/webhook')
      .set('Content-Type', 'application/json');
    return (sig ? r.set('X-Signature', sig) : r).send(b);
  };

  beforeAll(async () => {
    config.PAYMENT_WEBHOOK_SECRET = KEY;
    const mod = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: { record } }],
    }).compile();
    app = mod.createNestApplication({ rawBody: true, logger: false });
    await app.init();
  });

  beforeEach(() => record.mockClear());
  afterAll(() => app.close());

  it('imzosiz — 401, yozuvga yetmaydi', async () => {
    const res = await post(body);
    expect(res.status).toBe(401);
    expect(record).not.toHaveBeenCalled();
  });

  it('boshqa kalit bilan — 401', async () => {
    const res = await post(body, sign(body, 'boshqa-kalit'));
    expect(res.status).toBe(401);
    expect(record).not.toHaveBeenCalled();
  });

  it("imzodan keyin tana o'zgargan — 401", async () => {
    const res = await post(body.replace('120000', '1200'), sign(body, KEY));
    expect(res.status).toBe(401);
    expect(record).not.toHaveBeenCalled();
  });

  it("to'g'ri imzo — 200, servisga aynan shu to'lov", async () => {
    const res = await post(body, sign(body, KEY));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, duplicate: false });
    expect(record).toHaveBeenCalledWith({
      paymentId: 'pay_1',
      orderId: 5,
      status: 'paid',
      amount: 120000,
    });
  });

  it("imzo to'g'ri, maydon xato — 400, yozilmaydi", async () => {
    const bad = JSON.stringify({
      paymentId: 'pay_2',
      orderId: 5,
      status: 'ok',
      amount: 120000,
    });
    const res = await post(bad, sign(bad, KEY));
    expect(res.status).toBe(400);
    expect(record).not.toHaveBeenCalled();
  });

  it("kalit bo'sh — to'g'ri ko'rinadigan imzo ham 401", async () => {
    config.PAYMENT_WEBHOOK_SECRET = '';
    const res = await post(body, sign(body, ''));
    config.PAYMENT_WEBHOOK_SECRET = KEY;
    expect(res.status).toBe(401);
  });
});
