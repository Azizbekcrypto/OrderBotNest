import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database.module';
import { AppController } from './app.controller';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [DatabaseModule, TelegramModule],
  controllers: [AppController],
})
export class AppModule {}
