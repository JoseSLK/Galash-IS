import { expect, test } from '@playwright/test';
import { projectApi } from './project-api.fixture';

// D039 / TDB-T11: editors send the loaded updatedAt and explain a 409 instead of overwriting newer changes.
test('project editor sends updatedAt and explains a conflicting edit', async ({ page }) => {
  const state = await projectApi(page, 'admin');
  const loaded = state.projects[0].updatedAt;
  await page.route('**/api/projects/p1', route => route.request().method() === 'PATCH'
    ? (state.writes.push(route.request().postDataJSON()), route.fulfill({ status: 409, json: { error: 'el registro cambió desde que lo abriste; recarga y vuelve a intentarlo' } }))
    : route.fallback());
  await page.goto('/administracion');
  await page.locator('#admin-sections').getByRole('button', { name: 'Proyectos', exact: true }).click();
  await page.getByRole('button', { name: 'Editar proyecto', exact: true }).click();
  const dialog = page.locator('dialog[open]');
  await dialog.locator('[formcontrolname=title]').fill('Título concurrente');
  await dialog.getByRole('button', { name: 'Guardar actualización', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Otra persona modificó este proyecto');
  expect(state.writes.at(-1).updatedAt).toBe(loaded);
});

test('news editor sends updatedAt and shows the API conflict message', async ({ page }) => {
  const event = { id: 'e1', title: 'Taller', description: 'Descripción', type: 'taller', startAt: '2030-01-10T15:00:00Z', endAt: null, venue: 'Aula', meetingUrl: '', imageUrl: '', registrationUrl: '', status: 'borrador', updatedAt: '2026-11-16T10:00:00.123456Z' };
  const patches: Record<string, unknown>[] = [];
  await page.route('**/api/**', route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/api/users/me') return route.fulfill({ json: { id: 'admin', name: 'Ana', role: 'admin', status: 'activo', managed_seedbed_ids: [] } });
    if (pathname === '/api/events') return route.fulfill({ json: { events: [event] } });
    if (pathname === '/api/events/e1' && route.request().method() === 'PATCH') {
      patches.push(route.request().postDataJSON());
      return route.fulfill({ status: 409, json: { error: 'el registro cambió desde que lo abriste; recarga y vuelve a intentarlo' } });
    }
    if (pathname === '/api/events/e1') return route.fulfill({ json: event });
    return route.fulfill({ json: { seedbeds: [], requests: [], reviews: [], members: [], users: [] } });
  });
  await page.goto('/administracion');
  await page.locator('#admin-sections').getByRole('button', { name: 'Noticias', exact: true }).click();
  await page.getByText('Taller', { exact: true }).first().click();
  await page.getByLabel('Título', { exact: false }).fill('Taller actualizado');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('app-events-admin').getByRole('alert')).toContainText('el registro cambió desde que lo abriste');
  expect(patches.at(-1)?.['updatedAt']).toBe(event.updatedAt);
});
