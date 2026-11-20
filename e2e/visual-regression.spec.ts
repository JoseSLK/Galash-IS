import { expect, test } from '@playwright/test';

// TD-T14: compares public screens with the approved baseline in visual-regression.spec.ts-snapshots/.
// After an approved visual change, refresh with: npx playwright test e2e/visual-regression.spec.ts --update-snapshots
const screens = ['/semilleros', '/proyectos', '/noticias', '/integrantes', '/unete'];

test.use({ colorScheme: 'dark', reducedMotion: 'reduce' });

for (const path of screens) {
  test(`${path} matches the approved screenshot`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'baseline kept for desktop only');
    // shortcut: baselines come from a local Linux machine; font rendering on the CI runner differs. Regenerate them on CI to enable it there.
    test.skip(!!process.env['CI'], 'baseline not generated on the CI runner');
    await page.route('**/api/**', route => new URL(route.request().url()).pathname === '/api/users/me'
      ? route.fulfill({ status: 401, json: { error: 'sesión requerida' } })
      : route.fulfill({ json: { seedbeds: [], members: [], projects: [], events: [], pages: [], links: [], reviews: [] } }));
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${path.slice(1)}.png`, { fullPage: true, animations: 'disabled', mask: [page.locator('canvas')], maxDiffPixelRatio: 0.01 });
  });
}
