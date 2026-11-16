import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

// TD-T03, TD-T07, TD-T09, TD-T10, TU-T10 and TU-T11 on the public screens, with a simulated API.
const dir = 'docs/testing/evidence/R2026111608-design';
const screens = [
  { path: '/', nav: null },
  { path: '/nosotros', nav: 'Nosotros' },
  { path: '/semilleros', nav: 'Semilleros' },
  { path: '/proyectos', nav: 'Proyectos' },
  { path: '/noticias', nav: 'Noticias' },
  { path: '/integrantes', nav: 'Integrantes' },
  { path: '/unete', nav: null },
];
const empty = { seedbeds: [], members: [], projects: [], events: [], pages: [], links: [], reviews: [] };

type Mode = 'ok' | 'slow' | 'error';
async function api(page: Page, initial: Mode = 'ok') {
  const state = { mode: initial };
  await page.route('**/api/**', async route => {
    if (new URL(route.request().url()).pathname === '/api/users/me') return route.fulfill({ status: 401, json: { error: 'sesión requerida' } });
    const mode = state.mode;
    if (mode === 'slow') await new Promise(r => setTimeout(r, 2500));
    // A slow response may arrive after the page moved on; ignore that late fulfil.
    await (mode === 'error' ? route.fulfill({ status: 500, json: { error: 'falla simulada' } }) : route.fulfill({ json: empty })).catch(() => undefined);
  });
  return (mode: Mode) => { state.mode = mode; };
}

function save(name: string, data: unknown) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/${name}.json`, JSON.stringify(data, null, 2));
}

// TD-T03: every main menu entry leads to its route and a page heading.
test('main navigation reaches each section with its heading', async ({ page }, info) => {
  await api(page);
  const observed: Record<string, string> = {};
  for (const s of screens.filter(s => s.nav)) {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Abrir menú', exact: true });
    if (await toggle.isVisible()) await toggle.click();
    await page.locator('header').getByRole('link', { name: s.nav!, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`${s.path}$`));
    observed[s.nav!] = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ');
  }
  save(`navegacion-${info.project.name}`, observed);
});

// TD-T07: slow, empty and failing API responses each leave a visible state instead of a blank screen.
for (const s of screens.filter(s => ['/semilleros', '/proyectos', '/noticias', '/integrantes'].includes(s.path))) {
  test(`${s.path}: loading, empty and error states are communicated`, async ({ page }, info) => {
    const states: Record<string, string> = {};
    const setMode = await api(page, 'slow');
    await page.goto(s.path);
    const busy = page.locator('[aria-busy="true"], [role="status"], [role="progressbar"], [aria-live]').filter({ hasText: /\S/ }).first();
    states.cargando = await busy.isVisible().catch(() => false) ? (await busy.innerText()).trim() || '(indicador sin texto)' : '';
    setMode('ok');
    await page.goto(s.path);
    await page.waitForLoadState('networkidle');
    states.vacio = (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 300);
    setMode('error');
    await page.goto(s.path);
    await page.waitForLoadState('networkidle');
    const alert = page.locator('[role="alert"], [aria-live]').filter({ hasText: /\S/ }).first();
    states.error = await alert.isVisible().catch(() => false) ? (await alert.innerText()).trim() : '';
    await page.screenshot({ path: `${dir}/estado-error${s.path.replace('/', '-')}-${info.project.name}.png` });
    save(`estados${s.path.replace('/', '-')}-${info.project.name}`, states);
    expect.soft(states.cargando, 'loading indicator while the API is slow').not.toBe('');
    expect.soft(states.error, 'error announced in an alert or live region when the API fails').not.toBe('');
  });
}

// TD-T09 / TU-T11: no horizontal overflow at 320 px nor in landscape.
for (const [name, size] of [['320', { width: 320, height: 640 }], ['movil-horizontal', { width: 915, height: 412 }], ['tableta-horizontal', { width: 1138, height: 712 }]] as const) {
  test(`responsive ${name}: no horizontal scroll on public screens`, async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'one viewport set per run');
    await page.setViewportSize(size);
    await api(page);
    const overflow: Record<string, number> = {};
    for (const s of screens) {
      await page.goto(s.path);
      await page.waitForLoadState('networkidle');
      overflow[s.path] = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      await page.screenshot({ path: `${dir}/${name}${s.path === '/' ? '-home' : s.path.replace('/', '-')}.png` });
    }
    save(`overflow-${name}`, overflow);
    for (const [path, px] of Object.entries(overflow)) expect.soft(px, `${path} horizontal overflow (px)`).toBeLessThanOrEqual(0);
  });
}

// TD-T10: WCAG 2.1 A/AA automated rules and visible keyboard focus.
test('public screens pass axe WCAG A/AA and keep a visible focus ring', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'axe and keyboard run once on desktop');
  await api(page);
  const report: Record<string, { violations: string[]; focusWithoutRing: string[] }> = {};
  for (const s of screens) {
    await page.goto(s.path);
    await page.waitForLoadState('networkidle');
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const focusWithoutRing: string[] = [];
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const st = getComputedStyle(el);
        // A ring may be drawn on the element or on a :focus-within wrapper (up to 3 levels).
        const chain = [el, el.parentElement, el.parentElement?.parentElement, el.parentElement?.parentElement?.parentElement].filter((n): n is HTMLElement => !!n);
        const look = () => chain.map(n => { const c = getComputedStyle(n); return [c.borderColor, c.backgroundColor, c.boxShadow, c.outlineStyle].join('|'); }).join(';');
        const focusedLook = look();
        el.blur();
        const changed = look() !== focusedLook;
        el.focus();
        const ring = (st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) > 0) || st.boxShadow !== 'none' || changed;
        return { label: `${el.tagName.toLowerCase()} ${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)}`, ring };
      });
      if (f && !f.ring) focusWithoutRing.push(f.label);
    }
    report[s.path] = { violations: axe.violations.map(v => `${v.id} (${v.impact}, ${v.nodes.length})`), focusWithoutRing };
  }
  save('axe-teclado', report);
  for (const [path, r] of Object.entries(report)) {
    // Known: D009 (.brand visible text includes the decorative "G"). Update this list when D009 is fixed.
    expect.soft(r.violations, `${path} axe violations`).toEqual(['label-content-name-mismatch (serious, 1)']);
    expect.soft(r.focusWithoutRing, `${path} focused elements without a visible ring`).toEqual([]);
  }
});

// TU-T10: 200 % zoom (1280 px window shows a 640 px layout) keeps content reachable without horizontal scroll.
test('200% zoom keeps public screens usable', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'zoom emulation runs on desktop');
  await page.setViewportSize({ width: 640, height: 400 });
  await api(page);
  const overflow: Record<string, number> = {};
  for (const s of screens) {
    await page.goto(s.path);
    await page.waitForLoadState('networkidle');
    overflow[s.path] = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await expect(page.locator('h1').first()).toBeVisible();
  }
  save('zoom-200', overflow);
  for (const [path, px] of Object.entries(overflow)) expect.soft(px, `${path} overflow at 200 %`).toBeLessThanOrEqual(0);
});
