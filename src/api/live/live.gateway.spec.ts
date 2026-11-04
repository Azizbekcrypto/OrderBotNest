import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { config } from '../../config';
import { LiveGateway } from './live.gateway';

// Haqiqiy ulanish: Nest ilovasi tasodifiy portda ochiladi, klient — socket.io-client (panel ham shuni ishlatadi)
describe('LiveGateway', () => {
  let app: INestApplication;
  let url: string;
  const clients: Socket[] = [];

  beforeAll(async () => {
    config.ADMIN_PANEL_TOKEN = 'sinov-token';
    const mod = await Test.createTestingModule({
      providers: [LiveGateway],
    }).compile();
    app = mod.createNestApplication({ logger: false });
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    url = `http://localhost:${port}`;
  });

  afterAll(async () => {
    clients.forEach((c) => c.close());
    await app.close();
  });

  const connect = (auth: object) => {
    const c = io(url, { auth, reconnection: false });
    clients.push(c);
    return c;
  };
  const disconnected = (c: Socket) =>
    new Promise<string>((ok) => c.on('disconnect', (reason) => ok(reason)));

  it('tokensiz — server ulanishni yopadi, klient qayta urinmaydi', async () => {
    const c = connect({});
    expect(await disconnected(c)).toBe('io server disconnect');
    expect(c.active).toBe(false);
  });

  it("noto'g'ri token — xuddi shunday yopiladi", async () => {
    const c = connect({ token: 'notogri' });
    expect(await disconnected(c)).toBe('io server disconnect');
  });

  it("to'g'ri token — ulanadi va order-changed hodisasini oladi", async () => {
    const c = connect({ token: 'sinov-token' });
    await new Promise<void>((ok) => c.on('connect', () => ok()));
    const got = new Promise((ok) => c.on('order-changed', ok));
    app.get(LiveGateway).orderChanged(7, 'new');
    expect(await got).toEqual({ orderId: 7, reason: 'new' });
  });
});
