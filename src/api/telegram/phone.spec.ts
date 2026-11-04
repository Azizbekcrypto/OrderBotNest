import { isPhone } from './phone';

describe('isPhone', () => {
  it.each(['+998901234567', '998901234567'])("%s — to'g'ri raqam", (s) => {
    expect(isPhone(s)).toBe(true);
  });

  it.each([
    ['12345678', '8 ta raqam — qisqa'],
    ['+99890123456789', '14 ta raqam — uzun'],
    ['abc', 'harf'],
    ['', "bo'sh"],
  ])('%s — %s', (s) => {
    expect(isPhone(s)).toBe(false);
  });

  it('mijoz probel bilan yozadi', () => {
    expect(isPhone('+998 90 123 45 67')).toBe(true);
  });
});

describe("isPhone — qoida nimani o'tkazib yuboradi", () => {
  it("9 ta nol ham o'tadi", () => {
    expect(isPhone('000000000')).toBe(true);
  });
});
