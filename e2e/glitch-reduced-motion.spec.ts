import { expect, Page, test } from '@playwright/test';

// T045 revision: the requested hero animation stays active in both motion modes.
const framesPerSecond = async (page: Page) => {
  const start = await page.evaluate(() => (window as unknown as { __raf: number }).__raf);
  await page.waitForTimeout(1000);
  return (await page.evaluate(() => (window as unknown as { __raf: number }).__raf)) - start;
};

test('glitch background keeps animating in both motion preference modes', async ({ page }) => {
  // Count animation-frame callbacks; idle home has no other rAF loop.
  await page.addInitScript(() => {
    const w = window as unknown as { __raf: number };
    w.__raf = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => raf(time => { w.__raf++; callback(time); });
  });
  await page.route('**/api/**', route => route.fulfill({ status: 401 }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('app-glitch-background canvas')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect.poll(() => framesPerSecond(page), { timeout: 8000 }).toBeGreaterThan(10);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => framesPerSecond(page), { timeout: 8000 }).toBeGreaterThan(10);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(300);
  await expect.poll(() => framesPerSecond(page), { timeout: 8000 }).toBeGreaterThan(10);
});
