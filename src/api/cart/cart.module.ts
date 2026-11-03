import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from '../../core/entity';
import { CartService } from './cart.service';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem])],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
