import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { config } from '../../config';
import { parsePayment } from './payment-input';
import { PaymentService } from './payment.service';
import { isValidSignature } from './signature';

@Controller('payments')
export class PaymentController {
  private readonly log = new Logger('Payment');

  constructor(private readonly payments: PaymentService) {
    if (!config.PAYMENT_WEBHOOK_SECRET) {
      this.log.warn(
        "PAYMENT_WEBHOOK_SECRET bo'sh — har to'lov xabari 401 bilan rad etiladi (.env)",
      );
    }
  }

  // To'lov xizmati natijani shu manzilga o'zi yuboradi. Tartib muhim:
  // 1) imzo (xom tana bilan) → 2) maydonlar → 3) yozuv (takror — bir marta). Imzo yozuvdan OLDIN.
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string | undefined,
    @Body() body: unknown,
  ) {
    if (
      !isValidSignature(req.rawBody, signature, config.PAYMENT_WEBHOOK_SECRET)
    ) {
      this.log.warn("imzo noto'g'ri — xabar rad etildi");
      throw new UnauthorizedException("imzo noto'g'ri");
    }
    const p = parsePayment(body);
    const r = await this.payments.record(p);
    this.log.log(
      `${p.paymentId} · #${p.orderId} · ${p.status} · ${p.amount}${r.duplicate ? ' — takror, yozilmadi' : ''}`,
    );
    return { ok: true, duplicate: r.duplicate };
  }
}
