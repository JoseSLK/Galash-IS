import { expect, test } from '@playwright/test';

test('admin assigns a member as delegate and teacher as leader from user management', async ({ page }, info) => {
  let seedbed = { id: 's1', name: 'Semillero de prueba', description: 'Investigación', researchLine: 'IA', objective: 'Investigar', contactEmail: 'grupo@example.test', responsibleTeacherId: 'old-teacher' };
  let members = [
    { userId: 'other', name: 'Luis', lastName: 'Prueba', delegate: true },
    { userId: 'teacher', name: 'Ana', lastName: 'Prueba', delegate: false }
  ];
  let delegateIds: string[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path === '/api/users/me') return route.fulfill({ json: { id: 'admin', name: 'Admin', role: 'admin', status: 'activo' } });
    if (path === '/api/admin/members') return route.fulfill({ json: { users: [{ id: 'teacher', firebase_uid: 'teacher-uid', name: 'Ana', last_name: 'Prueba', email: 'ana@example.test', role: 'docente', status: 'activo' }] } });
    if (path === '/api/seedbeds') return route.fulfill({ json: { seedbeds: [seedbed] } });
    if (path === '/api/seedbeds/s1/members') return route.fulfill({ json: { members } });
    if (path === '/api/seedbeds/s1/delegates' && method === 'PUT') {
      delegateIds = route.request().postDataJSON().userIds;
      members = members.map(member => ({ ...member, delegate: delegateIds.includes(member.userId) }));
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/seedbeds/s1') {
      if (method === 'PATCH') seedbed = { ...seedbed, ...route.request().postDataJSON() };
      return route.fulfill({ json: seedbed });
    }
    return route.fulfill({ status: 401, json: { error: 'sin sesión' } });
  });
  await page.goto('/administracion');
  await page.getByPlaceholder('Buscar por nombre o correo electrónico').fill('Ana');
  const panel = page.locator('app-seedbed-assignments');
  await expect(panel).toBeVisible();
  await panel.getByLabel('Semillero', { exact: true }).selectOption('s1');
  await panel.getByRole('radio', { name: /^Delegado/ }).check();
  await panel.getByRole('button', { name: 'Guardar función' }).click();
  await expect(panel.getByText('Función actual: Delegado.')).toBeVisible();
  expect(delegateIds).toEqual(['other', 'teacher']);
  await panel.getByRole('radio', { name: /^Líder de semillero/ }).check();
  await panel.getByRole('button', { name: 'Guardar función' }).click();
  await expect(panel.getByText('Función actual: Líder de semillero.')).toBeVisible();
  expect(seedbed.responsibleTeacherId).toBe('teacher');
  await panel.screenshot({ style: 'app-dashboard { visibility: hidden !important; }', path: `docs/testing/evidence/R20261104-assignments/${info.project.name}.png` });
});
