import { NestFactory } from '@nestjs/core';
import { AppModule } from './api/app.module';
import { config } from './config';

async function main() {
  // rawBody: to'lov webhook'i imzosi xom baytlardan hisoblanadi — JSON qayta yozilsa imzo mos kelmaydi
  const app = await NestFactory.create(AppModule, { rawBody: true });
  await app.listen(config.PORT);
  console.log(`Server ${config.PORT}-portda ishlayapti`);
}

void main();
