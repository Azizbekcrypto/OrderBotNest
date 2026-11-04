import { som } from './texts';

describe('som', () => {
  it("120000 ni so'mda yozadi", () => {
    // toLocaleString('ru-RU') minglarni bo'linmas probel (U+00A0) bilan ajratadi
    expect(som(120000)).toBe("120\u00a0000 so'm");
  });

  it("kichik sonda probel yo'q", () => {
    expect(som(500)).toBe("500 so'm");
  });
});
