import { expect, test } from '@playwright/test';

test('profile displays leader and delegate functions and refreshes changed assignments', async ({ page }, info) => {
  let managed = ['s1', 's2'];
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/users/me') return route.fulfill({ json: { id: 'teacher', name: 'Ana', last_name: 'Prueba', role: 'docente', status: 'activo', email: 'ana@example.test', managed_seedbed_ids: managed } });
    if (path === '/api/seedbeds/s1') return route.fulfill({ json: { id: 's1', name: 'Inteligencia artificial', responsibleTeacherId: 'teacher' } });
    if (path === '/api/seedbeds/s2') return route.fulfill({ json: { id: 's2', name: 'Desarrollo web', responsibleTeacherId: 'other' } });
    return route.fulfill({ json: { projects: [], seedbeds: [], reviews: [] } });
  });
  await page.goto('/mi-perfil');
  const badges = page.getByLabel('Funciones en semilleros', { exact: true });
  await expect(badges.getByText('Líder de semillero · Inteligencia artificial')).toBeVisible();
  await expect(badges.getByText('Delegado · Desarrollo web')).toBeVisible();
  await expect(page.locator('.identity-card > .role-label')).toHaveText('Docente');
  await page.screenshot({ fullPage: true, style: 'app-dashboard { visibility: hidden !important; }', path: `docs/testing/evidence/R20261104-profile-functions/${info.project.name}.png` });
  await expect(page.getByRole('button', { name: 'Actualizar funciones' })).toHaveCount(0);
  await expect(page.locator('main').getByRole('link', { name: 'Administrar mi semillero' })).toHaveCount(0);
  managed = ['s2'];
  await page.reload();
  await expect(badges.getByText('Líder de semillero · Inteligencia artificial')).toHaveCount(0);
  await expect(badges.getByText('Delegado · Desarrollo web')).toBeVisible();
  managed = [];
  await page.reload();
  await expect(page.getByText('Sin funciones de líder o delegado asignadas.')).toBeVisible();
});
