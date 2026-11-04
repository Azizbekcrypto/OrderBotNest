import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { isAdminToken } from './admin-token';

// gateway — doimiy ulanishlarni qabul qiladigan klass (socket.io). HTTP server bilan bitta portda turadi (PORT).
// Panel bir marta ulanadi va ulanayotganda tokenni yuboradi: io(manzil, { auth: { token } }).
// Token ulanish ochilayotganda tekshiriladi: yo'q yoki noto'g'ri bo'lsa — server ulanishni yopadi
// (server yopgan ulanishga klient o'zi qayta ulanmaydi — panelda «Ulanmagan»).
// Hodisa order-changed — { orderId, reason }: qaysi buyurtma va nega o'zgargani.
// Yangi holatni panel GET /admin/orders dan qayta so'raydi — hodisa ichida ro'yxat ham, son ham yo'q.
export type OrderChangeReason = 'new' | 'status';

@WebSocketGateway()
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger('Live');

  @WebSocketServer()
  server?: Server;

  handleConnection(client: Socket) {
    if (!isAdminToken(client.handshake.auth?.token)) {
      client.disconnect();
      return;
    }
    client.data.admin = true;
    this.log.log(`panel ulandi: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    if (client.data.admin) this.log.log(`panel uzildi: ${client.id}`);
  }

  // Bazadagi o'zgarish tugagandan keyin chaqiriladi (tranzaksiya yopilgach). Oladi — hamma ulangan panel.
  // server yo'q bo'lsa (masalan, smoke HTTP'siz ishga tushirganda) — hodisa yuborilmaydi, bot ishlayveradi.
  orderChanged(orderId: number, reason: OrderChangeReason) {
    this.server?.emit('order-changed', { orderId, reason });
  }
}
