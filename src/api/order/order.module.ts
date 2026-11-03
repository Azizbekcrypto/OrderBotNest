import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { OrderService } from './order.service';

@Module({
  imports: [CatalogModule],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
