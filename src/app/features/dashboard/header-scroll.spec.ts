import { HeaderScrollState, INITIAL_HEADER_SCROLL, nextHeaderState, lastIndexAbove } from './header-scroll';

const run = (ys: number[], start: HeaderScrollState = INITIAL_HEADER_SCROLL) => ys.reduce(nextHeaderState, start);

describe('nextHeaderState', () => {
  it('compacts after scrolling down past the threshold', () => {
    expect(run([300]).compact).toBe(true);
  });

  it('ignores ±10px oscillation in both states', () => {
    const compact = run([600]);
    expect(run([590, 600, 590, 600, 590], compact).compact).toBe(true);
    const expanded = run([600, 540]);
    expect(expanded.compact).toBe(false);
    expect(run([550, 540, 550, 540, 550], expanded).compact).toBe(false);
  });

  it('expands after scrolling up 48px and always near the top', () => {
    expect(run([600, 552]).compact).toBe(false);
    expect(run([600, 560]).compact).toBe(true);
    expect(run([600, 40]).compact).toBe(false);
  });
});

describe('lastIndexAbove', () => {
  it('returns the last block whose top crossed the line, or the first when none did', () => {
    expect(lastIndexAbove([600, 1200, 1800], 450)).toBe(0);
    expect(lastIndexAbove([-300, 300, 900], 450)).toBe(1);
    expect(lastIndexAbove([-900, -300, 450], 450)).toBe(2);
    expect(lastIndexAbove([-2000, -1400, -800], 450)).toBe(2);
    expect(lastIndexAbove([], 450)).toBe(0);
  });
});
