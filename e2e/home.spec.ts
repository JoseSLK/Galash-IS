import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Backend is mocked: an anonymous visitor gets 401 from every API call.
  await page.route('**/api/**', route => route.fulfill({ status: 401 }));
  await page.goto('/');
});

test('public home renders main content', async ({ page }) => {
  await expect(page).toHaveTitle(/GALASH/);
  await expect(page.locator('main#contenido')).toBeVisible();
});

test('public home has no WCAG 2 A/AA violations', async ({ page }) => {
  // Known defect D003: .device-photo contrast 3.86:1. Remove this line once it is fixed.
  test.fail();
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([]);
});
