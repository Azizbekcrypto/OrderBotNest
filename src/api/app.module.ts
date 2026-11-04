import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database.module';
import { AppController } from './app.controller';
import { PaymentModule } from './payment/payment.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [DatabaseModule, TelegramModule, PaymentModule],
  controllers: [AppController],
})
export class AppModule {}
