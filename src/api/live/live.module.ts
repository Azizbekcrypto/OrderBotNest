import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { AdminController } from './admin.controller';
import { LiveGateway } from './live.gateway';

// Jonli panel: /admin sahifasi, GET /admin/orders va WebSocket gateway (order-changed hodisasi)
@Module({
  imports: [OrderModule],
  controllers: [AdminController],
  providers: [LiveGateway],
  exports: [LiveGateway],
})
export class LiveModule {}
