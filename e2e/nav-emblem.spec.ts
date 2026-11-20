import { expect, Page, test } from '@playwright/test';

// T044: the compact header must not flicker or resize the emblem box on small scroll jitter.
const scrollTo = async (page: Page, y: number) => {
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
  // Wait two frames (the header state is synced in requestAnimationFrame) and for its height transition to end.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => Promise.all(document.querySelector('.site-header')!.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished)));
};
const boxes = (page: Page) => page.evaluate(() => {
  const emblem = document.querySelector<HTMLElement>('.nav-emblem')!;
  const header = document.querySelector<HTMLElement>('.site-header')!;
  return { emblem: [emblem.offsetWidth, emblem.offsetHeight], header: header.offsetHeight };
});

test('header compact class and emblem box ignore ±10px scroll jitter', async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ status: 401 }));
  await page.goto('/');
  const header = page.locator('.site-header');
  const initial = await boxes(page);

  await scrollTo(page, 600);
  await expect(header).toHaveClass(/site-header--compact/);
  const compactClass = await header.getAttribute('class');
  // Compact state scales the emblem without changing its layout box. The fixed header may shrink
  // (design since ea7c89b) but must keep the same compact height while the scroll jitters.
  const compact = await boxes(page);
  expect(compact.emblem).toEqual(initial.emblem);

  for (const y of [590, 600, 590, 600, 590, 600]) {
    await scrollTo(page, y);
    expect(await header.getAttribute('class')).toBe(compactClass);
    expect(await boxes(page)).toEqual(compact);
  }
});
