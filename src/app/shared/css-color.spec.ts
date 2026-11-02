import { cssColor, cssColorString } from './css-color';

describe('cssColor', () => {
  afterEach(() => document.documentElement.style.removeProperty('--test-color'));

  it('reads a #rrggbb token from :root as 0-1 channels', () => {
    document.documentElement.style.setProperty('--test-color', '#7785AC');
    const [r, g, b] = cssColor('--test-color');
    expect(r).toBeCloseTo(0x77 / 255);
    expect(g).toBeCloseTo(0x85 / 255);
    expect(b).toBeCloseTo(0xac / 255);
    expect(cssColorString('--test-color')).toBe('rgb(119 133 172)');
  });

  it('fails loudly when the token is missing instead of drawing a wrong color', () => {
    expect(() => cssColor('--test-color')).toThrow(/--test-color/);
  });
});
