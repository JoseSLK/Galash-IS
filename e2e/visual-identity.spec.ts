import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

// PT-NF-01: captures each main screen and the computed typography and colors, to compare with report §11.4.2.
const pages = ['/', '/semilleros', '/integrantes', '/proyectos', '/noticias', '/nosotros', '/unete', '/mi-solicitud'];
const dir = 'docs/testing/evidence/R2026111604-visual';

test('main screens use one display font, one body font and the brand accent', async ({ page }, info) => {
  await page.route('**/api/**', route => new URL(route.request().url()).pathname === '/api/users/me'
    ? route.fulfill({ status: 401, json: { error: 'sesión requerida' } })
    : route.fulfill({ json: { seedbeds: [], members: [], projects: [], events: [], pages: [], links: [], reviews: [] } }));
  mkdirSync(dir, { recursive: true });
  const report: Record<string, unknown> = {};
  for (const path of pages) {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    report[path] = await page.evaluate(() => {
      const css = (el: Element | null, prop: string) => el ? getComputedStyle(el).getPropertyValue(prop).trim() : null;
      const root = document.documentElement;
      return {
        h1Font: css(document.querySelector('h1'), 'font-family'),
        bodyFont: css(document.body, 'font-family'),
        bodyBackground: css(document.body, 'background-color'),
        accentToken: css(root, '--galash-accent'),
        secondaryToken: css(root, '--galash-secondary'),
        bgToken: css(root, '--galash-bg'),
        loadedFonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')).filter((v, i, a) => a.indexOf(v) === i),
      };
    });
    await page.screenshot({ path: `${dir}/${info.project.name}${path === '/' ? '-home' : path.replace(/\//g, '-')}.png`, fullPage: true });
  }
  writeFileSync(`${dir}/computed-${info.project.name}.json`, JSON.stringify(report, null, 2));
  const values = Object.values(report) as { h1Font: string; bodyFont: string; accentToken: string }[];
  expect(new Set(values.map(v => v.h1Font)).size, 'one display font across screens').toBe(1);
  expect(new Set(values.map(v => v.bodyFont)).size, 'one body font across screens').toBe(1);
  expect(values.every(v => v.accentToken.toUpperCase() === '#F7C500'), 'Jonquil accent token').toBe(true);
});
