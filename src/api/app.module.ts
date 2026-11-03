import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [AppController],
})
export class AppModule {}
