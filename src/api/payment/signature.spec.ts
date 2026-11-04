import { isValidSignature, sign } from './signature';

// Imzo — xom tana + kalitdan HMAC-SHA256. Bitta bayt o'zgarsa ham mos kelmaydi
const KEY = 'sinov-kalit';
const body = Buffer.from(
  '{"paymentId":"pay_1","orderId":5,"status":"paid","amount":120000}',
);

describe('signature', () => {
  it("to'g'ri imzo — qabul", () => {
    expect(isValidSignature(body, sign(body, KEY), KEY)).toBe(true);
  });

  it('boshqa kalit bilan imzo — rad', () => {
    expect(isValidSignature(body, sign(body, 'boshqa-kalit'), KEY)).toBe(false);
  });

  it("tana o'zgargan (summa) — rad", () => {
    const changed = Buffer.from(body.toString().replace('120000', '1200'));
    expect(isValidSignature(changed, sign(body, KEY), KEY)).toBe(false);
  });

  it("JSON qayta yozilgan (bo'sh joy) — rad: imzo baytlardan", () => {
    const pretty = Buffer.from(
      JSON.stringify(JSON.parse(body.toString()), null, 1),
    );
    expect(isValidSignature(pretty, sign(body, KEY), KEY)).toBe(false);
  });

  it("sarlavha yo'q, qisqa yoki hex emas — rad (xato tashlamaydi)", () => {
    expect(isValidSignature(body, undefined, KEY)).toBe(false);
    expect(isValidSignature(body, 'abc', KEY)).toBe(false);
    expect(isValidSignature(body, 'z'.repeat(64), KEY)).toBe(false);
  });

  it("kalit bo'sh — har doim rad (bo'sh kalit bilan imzoni har kim yasaydi)", () => {
    expect(isValidSignature(body, sign(body, ''), '')).toBe(false);
  });
});
