import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // Hosting "tirikmi?" deb shu manzilni tekshiradi
  @Get()
  health() {
    return { ok: true, service: 'order-bot' };
  }
}
