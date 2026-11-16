import { evidenceRoot } from './evidence';
import { expect, test } from '@playwright/test';

test('mobile menu panel is opaque so the page behind does not show through', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop', 'menu panel only exists on small screens');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Abrir menú' });
  // Without a bell (no session) the menu button still sits at the right edge.
  const box = (await toggle.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(page.viewportSize()!.width - 80);
  await toggle.click();
  const nav = page.locator('#site-navigation');
  await expect(nav).toBeVisible();
  const background = await nav.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(background).toBe('rgb(16, 35, 50)');
  await page.screenshot({ path: `${evidenceRoot}/menu/${info.project.name}.png` });
});
