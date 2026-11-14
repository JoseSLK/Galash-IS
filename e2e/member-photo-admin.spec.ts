import { expect, Page, test } from '@playwright/test';

const member = { id: 'm1', name: 'Laura', last_name: 'Gómez', role: 'docente', status: 'activo', visible_publicly: true, seedbed_ids: [], photo_url: '' };
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function mock(page: Page, role: string, puts: { id: string; body: unknown }[]) {
  await page.route('https://images.example.test/**', route => route.fulfill({ contentType: 'image/png', body: pixel }));
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/users/me') return route.fulfill({ json: { id: 'u1', name: 'Ana', last_name: 'Admin', role, status: 'activo', email: 'ana@example.test', managed_seedbed_ids: [] } });
    if (path === '/api/members') return route.fulfill({ json: { members: [member] } });
    const match = path.match(/^\/api\/users\/([^/]+)\/photo$/);
    if (match && route.request().method() === 'PUT') {
      const body = route.request().postDataJSON(); puts.push({ id: match[1], body }); member.photo_url = body.photo_url;
      return route.fulfill({ json: { photo_url: body.photo_url } });
    }
    return route.fulfill({ json: { seedbeds: [], publications: [], requests: [], reviews: [], announcements: [] } });
  });
}

test('admin edits a member photo through an image link and can remove it', async ({ page }, info) => {
  member.photo_url = '';
  const puts: { id: string; body: unknown }[] = [];
  await mock(page, 'admin', puts);
  await page.goto('/integrantes/m1');
  await page.getByRole('button', { name: 'Editar foto de Laura Gómez' }).click();
  const input = page.getByLabel('Enlace de la imagen');
  await input.fill('notaurl');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('alert')).toContainText('https://');
  expect(puts).toHaveLength(0);
  const warning = page.locator('#photo-url-warning');
  await input.fill('https://media.licdn.com/dms/image/v2/abc/profile?e=1795042800&t=x');
  await expect(warning).toContainText('LinkedIn vencen');
  await input.fill('https://images.example.test/laura.png');
  await expect(warning).toBeEmpty();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('img', { name: 'Retrato de Laura Gómez' })).toHaveAttribute('src', 'https://images.example.test/laura.png');
  expect(puts).toEqual([{ id: 'm1', body: { photo_url: 'https://images.example.test/laura.png' } }]);
  await page.screenshot({ path: `docs/testing/evidence/R2026111308-member-photo/${info.project.name}.png` });
  await page.getByRole('button', { name: 'Editar foto de Laura Gómez' }).click();
  await page.getByRole('button', { name: 'Quitar foto' }).click();
  await expect(page.getByRole('img', { name: 'Foto pendiente de Laura Gómez' })).toBeVisible();
  expect(puts.at(-1)).toEqual({ id: 'm1', body: { photo_url: '' } });
});

test('non-admin users do not see the photo pencil', async ({ page }) => {
  member.photo_url = '';
  await mock(page, 'docente', []);
  await page.goto('/integrantes/m1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Laura');
  await expect(page.getByRole('button', { name: /Editar foto/ })).toHaveCount(0);
});
