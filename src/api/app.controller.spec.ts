import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppController } from './app.controller';

let app: INestApplication;
beforeAll(async () => {
  const mod = await Test.createTestingModule({
    controllers: [AppController],
  }).compile();
  app = mod.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

describe('HTTP: GET /', () => {
  it('200 va { ok: true }', async () => {
    const res = await request(app.getHttpServer()).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: 'order-bot' });
  });

  it("yo'q manzil — 404", async () => {
    const res = await request(app.getHttpServer()).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Cannot GET /nope');
  });
});
