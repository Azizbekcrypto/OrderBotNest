import { BadRequestException } from '@nestjs/common';
import type { PaymentStatus } from '../../core/entity';

export type PaymentInput = {
  paymentId: string;
  orderId: number;
  status: PaymentStatus;
  amount: number;
};

// Imzo to'g'ri bo'lgandan keyin — maydonlar. Xato bo'lsa 400 va hech narsa yozilmaydi
export function parsePayment(body: unknown): PaymentInput {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.paymentId !== 'string' || !b.paymentId) {
    throw new BadRequestException("paymentId yo'q");
  }
  if (!Number.isInteger(b.orderId)) {
    throw new BadRequestException("orderId butun son bo'lishi kerak");
  }
  if (b.status !== 'paid' && b.status !== 'failed') {
    throw new BadRequestException("status: 'paid' yoki 'failed'");
  }
  if (!Number.isInteger(b.amount) || (b.amount as number) <= 0) {
    throw new BadRequestException("amount musbat butun son bo'lishi kerak");
  }
  return {
    paymentId: b.paymentId,
    orderId: b.orderId as number,
    status: b.status,
    amount: b.amount as number,
  };
}
