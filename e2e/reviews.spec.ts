import AxeBuilder from '@axe-core/playwright';
import { expect, test, Page } from '@playwright/test';

async function prepare(page: Page, authenticated: boolean, role = 'admin'): Promise<void> {
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/users/me') return route.fulfill(authenticated
      ? { json: { id: 'demo-admin', name: 'Administradora', last_name: 'de prueba', role, status: 'activo' } }
      : { status: 401 });
    const seedbed = { id: 's1', name: 'Inteligencia artificial', description: 'Semillero de prueba', researchLine: 'Aprendizaje', objective: 'Investigar', topics: [{ title: 'Modelos', phrase: 'Modelos de prueba' }, { title: 'Datos', phrase: 'Datos de prueba' }, { title: 'Personas', phrase: 'Personas de prueba' }, { title: 'Aprendizaje', phrase: 'Aprendizaje de prueba' }] };
    if (url.pathname === '/api/seedbeds') return route.fulfill({ json: { seedbeds: [seedbed, { ...seedbed, id: 's2', name: 'Ciberseguridad' }] } });
    if (url.pathname.endsWith('/space')) return route.fulfill({ json: { seedbed, purpose: 'Investigar', responsible: { id: 'm1', name: 'Docente', lastName: 'de prueba' } } });
    if (url.pathname.endsWith('/members')) return route.fulfill({ json: { members: [] } });
    if (url.pathname === '/api/projects') return route.fulfill({ json: { projects: [] } });
    if (url.pathname === '/api/events') return route.fulfill({ json: { events: [] } });
    return route.fulfill({ status: 401 });
  });
  await page.goto('/semilleros?id=s1');
  await expect(page.locator('app-seedbed-reviews')).toBeVisible();
}
async function openHeader(page: Page): Promise<void> {
  const toggle = page.locator('app-dashboard .menu-toggle');
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
}
async function goAdmin(page: Page): Promise<void> {
  await openHeader(page);
  await page.locator('#header-auth-button').click();
  await page.getByRole('link', { name: 'Administración', exact: false }).click();
  if (await page.getByRole('button', { name: 'Mostrar menú', exact: true }).isVisible()) await page.getByRole('button', { name: 'Mostrar menú', exact: true }).click();
  await page.locator('.admin-sidebar button').filter({ hasText: 'Reseñas' }).click();
  await expect(page.locator('app-reviews-admin')).toBeVisible();
}
async function goSeedbed(page: Page): Promise<void> {
  await openHeader(page);
  await page.locator('#site-navigation').getByRole('link', { name: 'Semilleros', exact: true }).click();
  await expect(page.locator('app-seedbed-reviews')).toBeVisible();
}

test('anonymous visitors see demo reviews below projects without a submission field', async ({ page }, info) => {
  await prepare(page, false);
  await expect(page.locator('.review-grid .review-original')).toHaveCount(3);
  await expect(page.getByText('Inicia sesión desde el menú superior')).toBeVisible();
  await expect(page.locator('#review-text')).toHaveCount(0);
  const reviews = await page.locator('app-seedbed-reviews').boundingBox();
  const projects = await page.locator('section.projects').boundingBox();
  expect(reviews!.y).toBeGreaterThanOrEqual(projects!.y + projects!.height);
  const audit = await new AxeBuilder({ page }).include('app-seedbed-reviews').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.locator('app-seedbed-reviews').screenshot({ style: '.site-header { visibility: hidden !important; }', path: `docs/testing/evidence/R20261101-SEM08-motion/public-${info.project.name}.png` });
});

test('local submissions update admin notification, approval and moderation across navigation', async ({ page }, info) => {
  test.setTimeout(60000);
  const reviewCalls: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/') && request.url().includes('reviews')) reviewCalls.push(request.url()); });
  await prepare(page, true);
  const text = 'Sugiero compartir las lecturas antes de cada sesión.';
  const field = page.getByLabel('Tu voz también cuenta');
  await expect(field).toBeVisible();
  await field.fill('   ');
  await expect(page.getByRole('button', { name: 'Enviar reseña' })).toBeDisabled();
  await field.fill(text);
  await page.getByRole('button', { name: 'Enviar reseña' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Reseña enviada' })).toBeVisible();
  await expect(page.locator('.review-grid')).not.toContainText(text);
  await goAdmin(page);
  await expect(page.getByText('2 reseñas pendientes de revisión')).toBeVisible();
  if (await page.getByRole('button', { name: 'Mostrar menú', exact: true }).isVisible()) await page.getByRole('button', { name: 'Mostrar menú', exact: true }).click();
  await expect(page.locator('.review-count')).toHaveText('2');
  if (await page.getByRole('button', { name: 'Mostrar menú', exact: true }).isVisible()) await page.getByRole('button', { name: 'Mostrar menú', exact: true }).click();
  const card = page.locator('.moderation-grid .review-card').filter({ hasText: text });
  await card.getByRole('button', { name: 'Aceptar y publicar' }).click();
  await expect(page.getByText('1 reseña pendiente de revisión')).toBeVisible();
  await expect(card).toContainText('Publicada');
  const audit = await new AxeBuilder({ page }).include('app-reviews-admin').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.locator('app-reviews-admin').screenshot({ style: '.site-header { visibility: hidden !important; }', path: `docs/testing/evidence/R20261101-SEM08/admin-${info.project.name}.png` });
  await goSeedbed(page);
  await expect(page.locator('.review-grid')).toContainText(text);
  await page.getByRole('button', { name: 'Ciberseguridad', exact: true }).click();
  await expect(page.locator('.review-grid')).not.toContainText(text);
  await goAdmin(page);
  await card.getByRole('button', { name: 'Ocultar', exact: true }).click();
  await expect(card).toContainText('Oculta');
  await card.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await expect(card).toContainText('Rechazada');
  await goSeedbed(page);
  await expect(page.locator('.review-grid')).not.toContainText(text);
  expect(reviewCalls).toEqual([]);
  await page.reload();
  await expect(page.locator('.review-grid .review-original')).toHaveCount(3);
  await goAdmin(page);
  await expect(page.getByText('1 reseña pendiente de revisión')).toBeVisible();
  await expect(page.locator('.moderation-grid')).not.toContainText(text);
});


test('registered students can submit while administrative moderation stays protected', async ({ page }) => {
  await prepare(page, true, 'estudiante');
  await page.getByLabel('Tu voz también cuenta').fill('Una aportación de prueba.');
  await page.getByRole('button', { name: 'Enviar reseña' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Reseña enviada' })).toBeVisible();
  await page.goto('/administracion');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('app-reviews-admin')).toHaveCount(0);
});


test('existing review and graph animations run without activation controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await prepare(page, false);
  await expect(page.locator('.review-track')).toHaveCount(3);
  await expect(page.locator('.review-track').nth(0)).toHaveCSS('animation-name', /reviews-up$/);
  await expect(page.locator('.review-track').nth(1)).toHaveCSS('animation-name', /reviews-down$/);
  await expect(page.getByRole('button', { name: /Activar animación|Pausar reseñas|Activar órbita|Pausar órbita/ })).toHaveCount(0);
  const graph = page.locator('app-knowledge-graph');
  await graph.scrollIntoViewIfNeeded();
  const first = graph.locator('.satellite').first();
  const startX = await first.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);
  await expect.poll(() => first.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41), { timeout: 10000 }).toBeGreaterThan(startX + 30);
});
