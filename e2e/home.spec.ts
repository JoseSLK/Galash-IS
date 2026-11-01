import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Backend is mocked: an anonymous visitor gets 401 from every API call,
  // except the public seedbed list, so the home renders its seedbed section.
  await page.route('**/api/**', route => route.fulfill({ status: 401 }));
  await page.route('**/api/seedbeds', route => route.fulfill({ json: { seedbeds: [{
    id: 's1', name: 'Ciberseguridad', description: 'Descripción', researchLine: 'Seguridad digital', objective: 'Objetivo',
    topics: [{ title: 'Datos', phrase: 'Frase' }]
  }] } }));
  await page.goto('/');
});

test('public home renders main content', async ({ page }) => {
  await expect(page).toHaveTitle(/GALASH/);
  await expect(page.locator('main#contenido')).toBeVisible();
  await expect(page.locator('.home-stats > div').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const figureSize = await page.locator('.home-stats dd').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(figureSize).toBeLessThanOrEqual(52);
  await expect(page.locator('.hero-section app-glitch-background')).toHaveCSS('mask-image', /linear-gradient/);
  const toggle = page.locator('.menu-toggle');
  const authButton = page.locator('#header-auth-button');
  if (await toggle.isVisible()) {
    await expect(authButton).toBeHidden();
    await toggle.click();
    await expect(page.locator('#site-navigation')).toContainText('Iniciar sesión');
    await expect(authButton).toBeVisible();
    await expect(authButton).toBeEnabled();
    await authButton.click();
    await expect(page.locator('#header-auth-dropdown')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(authButton).toBeHidden();
  } else {
    await expect(authButton).toBeVisible();
  }
});

test('public home has no WCAG 2 A/AA violations', async ({ page }) => {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([]);
});
