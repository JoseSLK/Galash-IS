import { expect, Page, test } from '@playwright/test';

// PT-INT-03: the CvLAC link of a teacher profile appears when registered, only with a safe URL, and disappears when removed.
const cvlac = 'https://scienti.minciencias.gov.co/cvlac/visualizador/generarCurriculoCv.do?cod_rh=0000000001';
const member = { id: 'm1', name: 'Laura', last_name: 'Gómez', role: 'docente', status: 'activo', visible_publicly: true, seedbed_ids: [], photo_url: '', cvlac: '' };

async function mock(page: Page, link: string) {
  member.cvlac = link;
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/users/me') return route.fulfill({ status: 401, json: { error: 'sesión requerida' } });
    if (path === '/api/members') return route.fulfill({ json: { members: [member] } });
    if (path === '/api/members/m1') return route.fulfill({ json: member });
    return route.fulfill({ json: { seedbeds: [], publications: [], reviews: [] } });
  });
}

test('teacher profile shows a valid CvLAC link that opens safely in a new tab', async ({ page }, info) => {
  await mock(page, cvlac);
  await page.goto('/integrantes/m1');
  const link = page.getByRole('link', { name: 'Ver CvLAC ↗' });
  await expect(link).toHaveAttribute('href', cvlac);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
  await page.screenshot({ path: `docs/testing/evidence/R2026111602-cvlac/${info.project.name}.png` });
});

for (const [name, link] of [['removed', ''], ['unsafe', 'javascript:alert(1)']]) {
  test(`teacher profile hides the CvLAC link when it is ${name}`, async ({ page }) => {
    await mock(page, link);
    await page.goto('/integrantes/m1');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Laura');
    await expect(page.getByRole('link', { name: /CvLAC/ })).toHaveCount(0);
    await expect(page.getByText('[Enlace CvLAC pendiente]')).toBeVisible();
  });
}
