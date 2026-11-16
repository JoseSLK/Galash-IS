import { evidenceRoot } from './evidence';
import { expect, Page, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { projectApi } from './project-api.fixture';

// PT-NF-03: after an empty submit, every invalid field shows its message next to it and linked by aria-describedby.
const dir = `${evidenceRoot}/form-errors`;

async function session(page: Page, role: string | null) {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/users/me') return role
      ? route.fulfill({ json: { id: 'u1', name: 'Ana', last_name: 'Prueba', email: 'ana@example.test', role, status: 'activo', managed_seedbed_ids: [], document_number: '1000000001', phone: '3000000000', birth_date: '2000-01-01' } })
      : route.fulfill({ status: 401, json: { error: 'sesión requerida' } });
    return route.fulfill({ json: { seedbeds: [{ id: 's1', name: 'Semillero Uno', status: 'Activo', visibility: 'Publicado' }], members: [], events: [], requests: [], reviews: [], projects: [] } });
  });
}

const section = (page: Page, name: string) => page.locator('#admin-sections').getByRole('button', { name, exact: true }).click();

type Field = { field: string; message: string; linked: boolean; distance: number | null };

async function invalidFields(page: Page, scope: string): Promise<Field[]> {
  return page.locator(scope).evaluate(root => [...root.querySelectorAll<HTMLElement>('[aria-invalid="true"], input.ng-invalid, select.ng-invalid, textarea.ng-invalid')]
    .filter(el => el.offsetParent !== null)
    .map(el => {
      const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      const described = ids.map(id => document.getElementById(id)).filter((m): m is HTMLElement => !!m && m.offsetParent !== null && /\S/.test(m.textContent ?? ''));
      const container = el.closest('label, .field, fieldset') ?? el.parentElement;
      const nearby = container?.querySelector<HTMLElement>('.error, [role=alert], .field-error');
      const message = described.find(m => /error|alert/.test(m.className + (m.getAttribute('role') ?? ''))) ?? described[0] ?? nearby ?? null;
      const box = el.getBoundingClientRect(), mbox = message?.getBoundingClientRect();
      return {
        field: el.getAttribute('formcontrolname') ?? el.getAttribute('name') ?? el.id,
        message: message?.textContent?.trim() ?? '',
        linked: !!message && described.includes(message),
        distance: mbox ? Math.round(Math.max(0, mbox.top - box.bottom, box.top - mbox.bottom)) : null,
      };
    }));
}

// A form tagged with a known defect is expected to fail (test.fail) until that defect is fixed.
const forms: { name: string; role: string | null; defect?: string; open: (page: Page) => Promise<string> }[] = [
  { name: 'consulta-solicitud', role: 'visitante', open: async page => {
    await page.goto('/mi-solicitud'); await page.getByRole('button', { name: 'Consultar estado' }).click(); return 'form'; } },
  { name: 'unete', role: 'visitante', open: async page => {
    await page.goto('/unete'); await page.getByRole('button', { name: /Revisar solicitud|Enviar solicitud/ }).click(); return 'form'; } },
  { name: 'crear-semillero', role: 'admin', open: async page => {
    await page.goto('/administracion'); await section(page, 'Semilleros'); await page.getByRole('button', { name: 'Crear semillero' }).click(); return 'form.seedbed-form'; } },
  { name: 'noticia', role: 'admin', open: async page => {
    await page.goto('/administracion'); await section(page, 'Noticias'); await page.getByRole('button', { name: '+ Nueva noticia' }).click();
    await page.getByRole('button', { name: 'Crear borrador' }).click(); return 'app-events-admin form'; } },
];

for (const form of forms) {
  test(`${form.name}: validation errors are next to their fields`, async ({ page }, info) => {
    test.fail(!!form.defect, `${form.defect}: errores solo a nivel de formulario`);
    await session(page, form.role);
    const scope = await form.open(page);
    await expect(page.locator(scope).getByRole('alert').or(page.locator(`${scope} [aria-invalid="true"]`)).first()).toBeVisible();
    const fields = await invalidFields(page, scope);
    expect(fields.length, 'invalid fields detected').toBeGreaterThan(0);
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/${form.name}-${info.project.name}.json`, JSON.stringify(fields, null, 2));
    await page.screenshot({ path: `${dir}/${form.name}-${info.project.name}.png`, fullPage: true });
    for (const f of fields) {
      expect.soft(f.message, `${f.field}: visible message`).not.toBe('');
      expect.soft(f.linked, `${f.field}: message linked by aria-describedby`).toBe(true);
      expect.soft(f.distance ?? Infinity, `${f.field}: message within 100px`).toBeLessThanOrEqual(100);
    }
  });
}

test('proyecto: validation errors are next to their fields', async ({ page }, info) => {
  await projectApi(page, 'admin');
  await page.goto('/administracion');
  await page.locator('#admin-sections').getByRole('button', { name: 'Proyectos', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar proyecto', exact: true }).click();
  const dialog = page.locator('dialog[open]');
  await dialog.getByRole('button', { name: 'Registrar proyecto aceptado', exact: true }).click();
  await page.waitForTimeout(300);
  const invalid = await invalidFields(page, 'dialog[open]');
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/proyecto-${info.project.name}.json`, JSON.stringify(invalid, null, 2));
  await page.screenshot({ path: `${dir}/proyecto-${info.project.name}.png` });
  expect(invalid.length, 'invalid fields are marked with aria-invalid').toBeGreaterThan(0);
  for (const f of invalid) {
    expect.soft(f.message, `${f.field}: visible message`).not.toBe('');
    expect.soft(f.linked, `${f.field}: message linked by aria-describedby`).toBe(true);
    expect.soft(f.distance ?? Infinity, `${f.field}: message within 100px`).toBeLessThanOrEqual(100);
  }
});
