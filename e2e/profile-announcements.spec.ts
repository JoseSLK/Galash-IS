import { expect, test } from '@playwright/test';

test('docente reads and confirms an announcement from the profile', async ({ page }) => {
  const reads: string[] = [];
  const notice = { id: 'a1', title: 'Directriz de cierre', description: 'Entregar informes antes del viernes.', attachments: [], status: 'publicado', authorId: 'admin', authorName: 'Admin', createdAt: new Date().toISOString(), publishedAt: new Date().toISOString(), readConfirmed: false };
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/users/me') return route.fulfill({ json: { id: 'teacher', name: 'Ana', last_name: 'Prueba', role: 'docente', status: 'activo', email: 'ana@example.test', managed_seedbed_ids: [] } });
    if (path === '/api/announcements') return route.fulfill({ json: { announcements: [notice] } });
    if (path === '/api/announcements/a1') return route.fulfill({ json: notice });
    if (path === '/api/announcements/a1/read-confirmations') { reads.push(route.request().method()); notice.readConfirmed = true; return route.fulfill({ status: 204 }); }
    return route.fulfill({ json: { projects: [], seedbeds: [], events: [], reviews: [] } });
  });
  await page.goto('/mi-perfil');
  const section = page.getByRole('region', { name: 'Comunicados' });
  await expect(section.getByText('Pendiente de lectura')).toBeVisible();
  await expect(section.getByRole('button', { name: /Nueva reunión/ })).toHaveCount(0);
  await expect(section.getByRole('button', { name: '+ Nuevo comunicado' })).toBeVisible();
  await section.getByRole('button', { name: /Directriz de cierre/ }).click();
  await page.getByRole('button', { name: 'Marcar como leído' }).click();
  await expect(page.getByRole('button', { name: 'Leído', exact: true })).toBeDisabled();
  expect(reads).toEqual(['POST']);
});

test('profile hides announcements for students', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/users/me') return route.fulfill({ json: { id: 'student', name: 'Luis', last_name: 'Prueba', role: 'estudiante', status: 'activo', email: 'luis@example.test', managed_seedbed_ids: [] } });
    return route.fulfill({ json: { projects: [], seedbeds: [] } });
  });
  await page.goto('/mi-perfil');
  await expect(page.locator('.identity-card > .role-label')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Comunicados' })).toHaveCount(0);
});
