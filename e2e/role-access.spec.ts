import { evidenceRoot } from './evidence';
import { expect, Page, test } from '@playwright/test';

// PT-TR-02: simulated session per role; account menu and direct access to guarded routes.
type Role = 'anonimo' | 'visitante' | 'estudiante' | 'docente' | 'delegado' | 'admin';
const roles: Role[] = ['anonimo', 'visitante', 'estudiante', 'docente', 'delegado', 'admin'];

async function mock(page: Page, role: Role) {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/users/me') {
      if (role === 'anonimo') return route.fulfill({ status: 401, json: { error: 'sesión requerida' } });
      return route.fulfill({ json: { id: 'u1', name: 'Usuario', last_name: 'Prueba', email: 'usuario@example.test', status: 'activo',
        role: role === 'delegado' ? 'estudiante' : role, managed_seedbed_ids: role === 'delegado' ? ['s1'] : [] } });
    }
    if (path === '/api/seedbeds/s1') return route.fulfill({ json: { id: 's1', name: 'Semillero Uno', responsibleTeacherId: 'otro', status: 'Activo', visibility: 'Publicado' } });
    return route.fulfill({ json: { seedbeds: [], members: [], projects: [], requests: [], reviews: [], activities: [], events: [], announcements: [], publications: [] } });
  });
}

async function openAccountMenu(page: Page) {
  await expect(page.locator('app-dashboard .site-header')).toBeVisible();
  const navigation = page.getByRole('button', { name: 'Abrir menú', exact: true });
  if (await navigation.isVisible()) await navigation.click();
  await page.locator('[aria-controls=header-auth-dropdown]').click();
}

for (const role of roles) {
  test(`${role}: account menu matches the role`, async ({ page }, info) => {
    await mock(page, role);
    await page.goto('/');
    await openAccountMenu(page);
    const menu = page.locator('#header-auth-dropdown');
    if (role === 'anonimo') {
      await expect(menu.getByRole('button', { name: /Iniciar sesión con Google/ })).toBeVisible();
      await expect(menu.getByRole('link', { name: /Mi perfil/ })).toHaveCount(0);
    } else {
      await expect(menu.getByRole('link', { name: /Mi perfil/ })).toBeVisible();
    }
    await expect(menu.getByText('Comprobando acceso al semillero…')).toHaveCount(0);
    await expect(menu.getByRole('link', { name: /^Administración/ })).toHaveCount(role === 'admin' ? 1 : 0);
    await expect(menu.getByRole('link', { name: /Administrar mi semillero/ })).toHaveCount(role === 'delegado' ? 1 : 0);
    await page.screenshot({ path: `${evidenceRoot}/roles/${role}-${info.project.name}.png` });
  });

  test(`${role}: direct URL access to guarded routes`, async ({ page }) => {
    await mock(page, role);
    const panel = page.locator('#admin-screen-title');

    await page.goto('/administracion');
    if (role === 'admin') await expect(panel).toBeVisible();
    else await expect(page).toHaveURL(/\/$/);

    await page.goto('/mi-perfil');
    if (role === 'anonimo') await expect(page).toHaveURL(/\/$/);
    else { await expect(page).toHaveURL(/\/mi-perfil$/); await expect(page.locator('app-profile')).toBeVisible(); }

    await page.goto('/gestion-semillero');
    if (role === 'anonimo') await expect(page).toHaveURL(/\/$/);
    else if (role === 'delegado') await expect(page.getByText('ADMINISTRACIÓN · MI SEMILLERO')).toBeVisible();
    else {
      await expect(page.getByRole('alert').filter({ hasText: 'No tienes semilleros asignados' })).toBeVisible();
      await expect(panel).toHaveCount(0);
    }
  });
}
