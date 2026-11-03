import { NestFactory } from '@nestjs/core';
import { AppModule } from './api/app.module';
import { config } from './config';

async function main() {
  const app = await NestFactory.create(AppModule);
  await app.listen(config.PORT);
  console.log(`Server ${config.PORT}-portda ishlayapti`);
}

void main();
