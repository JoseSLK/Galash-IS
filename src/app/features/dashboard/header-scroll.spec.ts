import { HeaderScrollState, INITIAL_HEADER_SCROLL, nextHeaderState } from './header-scroll';

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
