import { evidenceRoot } from './evidence';
import { expect, Page, test } from '@playwright/test';

const me = (role: string, managed: string[] = []) => ({ id: 'u1', name: 'Ana', last_name: 'Prueba', role, status: 'activo', email: 'ana@example.test', managed_seedbed_ids: managed });

async function mock(page: Page, user: object, extra: (path: string) => object | undefined) {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/users/me') return route.fulfill({ json: user });
    const body = extra(path);
    if (body) return route.fulfill({ json: body });
    return route.fulfill({ json: { projects: [], seedbeds: [], events: [], reviews: [], requests: [], announcements: [], users: [] } });
  });
}

test('admin bell counts open requests and pending reviews and links to each section', async ({ page }, info) => {
  await mock(page, me('admin'), path => {
    if (path === '/api/admin/registration-requests') return { requests: [{ id: 'r1', estado: 'Radicada' }, { id: 'r2', estado: 'Pendiente de información' }, { id: 'r3', estado: 'Aprobada' }] };
    if (path === '/api/admin/seedbed-reviews') return { reviews: [{ id: 'v1', seedbedId: 's1', authorId: 'a', text: 't', status: 'pendiente', createdAt: null }] };
    return undefined;
  });
  await page.goto('/');
  const bell = page.getByRole('button', { name: 'Notificaciones: 3 pendientes' });
  await expect(bell).toBeVisible();
  await bell.click();
  const panel = page.getByRole('region', { name: 'Notificaciones' });
  await expect(panel.getByRole('link', { name: /2\s*Postulaciones sin resolver/ })).toBeVisible();
  // Bell and panel stay inside the viewport on every device without opening the menu.
  const width = page.viewportSize()!.width;
  for (const box of [await bell.boundingBox(), await panel.boundingBox()]) { expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width); }
  await page.screenshot({ path: `${evidenceRoot}/bell/${info.project.name}.png` });
  await panel.getByRole('link', { name: /1\s*Reseñas por moderar/ }).click();
  await expect(page).toHaveURL(/\/administracion\?section=reviews/);
  await expect(page.locator('[aria-current="true"], .current-section').filter({ hasText: /Reseñas/ }).first()).toBeVisible();
});

test('docente bell lists unread announcements, announces new ones and clears after reading', async ({ page }) => {
  await page.clock.install();
  const notices = [{ id: 'a1', title: 'Directriz de cierre', description: 'd', attachments: [], status: 'publicado', authorId: 'adm', createdAt: '2026-11-01T10:00:00Z', publishedAt: '2026-11-01T10:00:00Z', readConfirmed: false }];
  await mock(page, me('profesor'), path => {
    if (path === '/api/announcements') return { announcements: notices };
    if (path.startsWith('/api/announcements/a')) return notices.find(n => path.endsWith(n.id)) ?? notices[0];
    return undefined;
  });
  await page.route('**/api/announcements/*/read-confirmations', route => { notices.forEach(n => { if (route.request().url().includes(n.id)) n.readConfirmed = true; }); return route.fulfill({ status: 204 }); });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Notificaciones: 1 pendientes' })).toBeVisible();
  notices.push({ ...notices[0], id: 'a2', title: 'Reunión general', publishedAt: '2026-11-02T10:00:00Z', readConfirmed: false });
  // fastForward fires the 60 s poll once; runFor would replay every animation frame and take ~25 s of real time (D007).
  await page.clock.fastForward(61_000);
  await expect(page.getByRole('status').filter({ hasText: 'Nuevo comunicado: Reunión general' })).toBeAttached();
  const bell = page.getByRole('button', { name: 'Notificaciones: 2 pendientes' });
  await bell.click();
  const item = page.getByRole('region', { name: 'Notificaciones' }).getByRole('link', { name: /Comunicados sin leer/ });
  await expect(item).toContainText('Reunión general');
  await item.click();
  await expect(page).toHaveURL(/\/mi-perfil/);
  const section = page.getByRole('region', { name: 'Comunicados' });
  await section.getByRole('button', { name: /Reunión general/ }).click();
  await page.getByRole('button', { name: 'Marcar como leído' }).click();
  await expect(page.getByRole('button', { name: 'Notificaciones: 1 pendientes' })).toBeAttached();
});

test('students without seedbed duties get no bell', async ({ page }) => {
  await mock(page, me('estudiante'), () => undefined);
  await page.goto('/');
  await expect(page.locator('.account-avatar').first()).toBeAttached();
  await expect(page.getByRole('button', { name: /Notificaciones/ })).toHaveCount(0);
});

test('leader bell counts requests of managed seedbeds and links to the leader panel', async ({ page }) => {
  await mock(page, me('estudiante', ['s1']), path => {
    if (path === '/api/admin/registration-requests') return { requests: [{ id: 'r1', seedbedId: 's1', estado: 'En revisión' }] };
    if (path === '/api/seedbeds/s1') return { id: 's1', name: 'IA', responsibleTeacherId: 'other' };
    return undefined;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Notificaciones: 1 pendientes' }).click();
  await page.getByRole('link', { name: /Postulaciones sin resolver en tus semilleros/ }).click();
  await expect(page).toHaveURL(/\/gestion-semillero/);
});
