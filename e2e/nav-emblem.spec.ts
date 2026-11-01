import { expect, Page, test } from '@playwright/test';

// T044: the compact header must not flicker or resize the emblem box on small scroll jitter.
const scrollTo = async (page: Page, y: number) => {
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
  // Wait two frames: the header state is synced in requestAnimationFrame.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
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
  // Compact state only scales the emblem: its layout box and the header height stay put.
  expect(await boxes(page)).toEqual(initial);

  for (const y of [590, 600, 590, 600, 590, 600]) {
    await scrollTo(page, y);
    expect(await header.getAttribute('class')).toBe(compactClass);
    expect(await boxes(page)).toEqual(initial);
  }
});
