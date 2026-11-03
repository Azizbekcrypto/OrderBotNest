import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { CatalogModule } from '../catalog/catalog.module';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { TelegramService } from './telegram.service';

@Module({
  imports: [UserModule, CatalogModule, CartModule, OrderModule],
  providers: [TelegramService],
})
export class TelegramModule {}
