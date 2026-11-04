import { createHmac, timingSafeEqual } from 'crypto';

// To'lov xizmati har xabarni imzolaydi: X-Signature = HMAC-SHA256(xom tana, PAYMENT_WEBHOOK_SECRET), 64 belgili hex.
// Biz xuddi shu hisobni qilamiz va solishtiramiz. Kalit faqat bizda va xizmatda — boshqa hech kim to'g'ri imzo yasay olmaydi.
export function sign(rawBody: Buffer | string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function isValidSignature(
  rawBody: Buffer | undefined,
  header: unknown,
  secret: string,
): boolean {
  // kalit bo'sh bo'lsa hech qanday xabar qabul qilinmaydi (bo'sh kalit bilan imzoni har kim yasaydi)
  if (!secret || !rawBody || typeof header !== 'string') return false;
  const expected = Buffer.from(sign(rawBody, secret), 'hex');
  const got = Buffer.from(header, 'hex');
  // uzunlik farq qilsa — darhol yo'q; teng bo'lsa timingSafeEqual: javob vaqtidan imzoni taxmin qilib bo'lmaydi
  return got.length === expected.length && timingSafeEqual(got, expected);
}
