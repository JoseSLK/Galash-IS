import { expect, test, type Page } from '@playwright/test';
async function openAccountMenu(page: Page): Promise<void> {
  await expect(page.locator('app-dashboard .site-header')).toBeVisible();
  const navigation = page.getByRole('button', { name: 'Abrir menú', exact: true });
  if (await navigation.isVisible()) await navigation.click();
  await page.locator('[aria-controls=header-auth-dropdown]').click();
}
async function chooseSection(page: Page, name: string): Promise<void> {
  if (await page.getByRole('button', { name: 'Mostrar menú', exact: true }).isVisible()) await page.getByRole('button', { name: 'Mostrar menú', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
}

for (const role of ['admin', 'docente', 'estudiante']) {
  test(`account menu keeps global administration for admin and hides leadership from a non-leader ${role}`, async ({ page }) => {
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/users/me') return route.fulfill({ json: { id:'user',name:'Usuario',role,status:'activo',managed_seedbed_ids:['delegated'] } });
      if (path === '/api/seedbeds/delegated') return route.fulfill({json:{id:'delegated',name:'Otro semillero',responsibleTeacherId:'other'}});
      return route.fulfill({json:{projects:[],seedbeds:[],reviews:[]}});
    });
    await page.goto('/mi-perfil');
    await openAccountMenu(page);
    const menu = page.locator('#header-auth-dropdown');
    if (role === 'admin') await expect(menu.getByRole('link',{name:'Administración',exact:true})).toBeVisible();
    else { await expect(menu.getByText('Comprobando acceso al semillero…')).toHaveCount(0); await expect(menu.getByRole('link',{name:'Administración',exact:true})).toHaveCount(0); }
    await expect(menu.getByRole('link',{name:'Administrar mi semillero'})).toHaveCount(0);
    if (role === 'admin') {
      await menu.getByRole('link',{name:'Administración',exact:true}).click();
      await expect(page.locator('app-admin')).toBeVisible();
      await expect(page.locator('#admin-screen-title')).toHaveText('Gestión de usuarios');
      await chooseSection(page, 'Eventos');
      await expect(page.locator('app-events-admin')).toBeVisible();
      await expect(page.getByText(/Pendiente para el líder: el backend aún no ofrece/)).toHaveCount(0);
    }
  });
}


test('leader enters own panel from profile and only loads scoped requests', async ({ page }) => {
  const calls: string[] = [];
  let requestState = 'Radicada';
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()); calls.push(url.pathname + url.search);
    if (url.pathname === '/api/users/me') return route.fulfill({ json: { id: 'leader', name: 'Líder', role: 'docente', status: 'activo', managed_seedbed_ids: ['own', 'delegated'] } });
    if (url.pathname.startsWith('/api/seedbeds/')) return route.fulfill({ json: { id: url.pathname.endsWith('/own') ? 'own' : 'delegated', name: 'Semillero propio', responsibleTeacherId: url.pathname.endsWith('/own') ? 'leader' : 'other' } });
    if (url.pathname === '/api/admin/registration-requests') return route.fulfill({ json: { requests: [{ id: 'r1', seedbedId: 'own', nombre: 'Solicitud propia', estado: requestState, fechaRadicacion: '2026-11-01', fechaActualizacion: '2026-11-01' }] } });
    if (url.pathname === '/api/admin/registration-requests/r1/status') { requestState = route.request().postDataJSON().estado; return route.fulfill({json:{id:'r1',seedbedId:'own',nombre:'Solicitud propia',estado:requestState,fechaRadicacion:'2026-11-01'}}); }
    if (url.pathname === '/api/admin/registration-requests/r1') return route.fulfill({json:{id:'r1',seedbedId:'own',nombre:'Solicitud propia',estado:requestState,historial:[]}});
    return route.fulfill({ json: { projects: [], seedbeds: [], reviews: [] } });
  });
  await page.goto('/mi-perfil');
  await openAccountMenu(page);
  await expect(page.locator('#header-auth-dropdown').getByRole('link', { name: 'Administrar mi semillero' })).toBeVisible();
  await page.locator('#header-auth-dropdown').screenshot({ path: 'docs/testing/evidence/R20261104-leader-menu/account-menu.png' });
  await page.locator('#header-auth-dropdown').getByRole('link', { name: 'Administrar mi semillero' }).click();
  await expect(page.locator('#admin-screen-title')).toHaveText('Solicitudes de ingreso');
  await expect(page.getByText('Solicitud propia', { exact: true })).toBeVisible();
  await expect(page.locator('app-admin')).toBeVisible();
  await expect(page.locator('app-leader')).toHaveCount(0);
  await expect(page.locator('.search-status').filter({ hasText: 'Semillero propio' })).toBeVisible();
  expect(calls).toContain('/api/admin/registration-requests?seedbedId=own');
  expect(calls).not.toContain('/api/admin/registration-requests');
  await page.getByRole('button',{name:'Revisar solicitud de Solicitud propia'}).click();
  await page.getByLabel('Observación').fill('Revisión del semillero');
  await page.getByRole('button',{name:'Pasar a En revisión'}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(requestState).toBe('En revisión');
  await chooseSection(page, 'Proyectos');
  await expect(page.getByText(/Pendiente para el líder: el backend debe restringir/)).toBeVisible();
  expect(calls.some(path => path.startsWith('/api/admin/members'))).toBe(false);
  await page.goto('/gestion-semillero?seedbedId=delegated');
  await expect(page.getByText('No tienes acceso como líder a este semillero.')).toBeVisible();
});

test('leader manages own semillero, members, activities and creates and publishes a scoped event', async ({ page }, info) => {
  const calls: string[] = [];
  let seedbed = { id:'own', name:'Semillero propio', description:'Descripción', researchLine:'IA', objective:'Investigar', contactEmail:'grupo@example.test', responsibleTeacherId:'leader', status:'Publicado', visibility:'Publicado' };
  let members = [{userId:'a',name:'Ana',lastName:'Prueba',delegate:false},{userId:'b',name:'Luis',lastName:'Prueba',delegate:true}];
  let activities: any[] = []; let event: any;
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()); const path=url.pathname; const method=route.request().method(); calls.push(method+' '+path+url.search);
    if(path==='/api/users/me') return route.fulfill({json:{id:'leader',name:'Líder',role:'docente',status:'activo',managed_seedbed_ids:['own']}});
    if(path==='/api/seedbeds/own') {if(method==='PATCH') seedbed={...seedbed,...route.request().postDataJSON()}; return route.fulfill({json:seedbed});}
    if(path==='/api/seedbeds/own/visibility') {seedbed={...seedbed,status:route.request().postDataJSON().status,visibility:route.request().postDataJSON().status};return route.fulfill({json:seedbed});}
    if(path==='/api/admin/registration-requests') return route.fulfill({json:{requests:[]}});
    if(path==='/api/seedbeds/own/members') {if(method==='POST')members.push({userId:route.request().postDataJSON().userId,name:'Eva',lastName:'Prueba',delegate:false});return route.fulfill({json:method==='GET'?{members}:{}});}
    if(path==='/api/seedbeds/own/members/c') {members=members.filter(m=>m.userId!=='c');return route.fulfill({status:204});}
    if(path==='/api/seedbeds/own/delegates') {const ids=route.request().postDataJSON().userIds;expect(ids).toEqual(['b','a']);members=members.map(m=>({...m,delegate:ids.includes(m.userId)}));return route.fulfill({status:204});}
    if(path==='/api/members') return route.fulfill({json:{members:[{id:'c',name:'Eva',last_name:'Prueba',role:'estudiante'}]}});
    if(path==='/api/seedbeds/own/activities') {if(method==='POST'){const a={...route.request().postDataJSON(),id:'activity',seedbedId:'own'};activities.push(a);return route.fulfill({json:a});}return route.fulfill({json:{activities}});}
    if(path==='/api/activities/activity') {if(method==='PATCH')activities[0]={...activities[0],...route.request().postDataJSON()};return route.fulfill({json:activities[0]});}
    if(path==='/api/events'&&method==='POST') {expect(route.request().postDataJSON().seedbedId).toBe('own');event={...route.request().postDataJSON(),id:'event',status:'borrador'};return route.fulfill({status:201,json:event});}
    if(path==='/api/events/event/publish') {event={...event,status:'publicado'};return route.fulfill({json:event});}
    return route.fulfill({json:{seedbeds:[],projects:[],reviews:[]}});
  });
  await page.goto('/gestion-semillero?seedbedId=own');
  await chooseSection(page, 'Mi semillero');
  await page.getByLabel('Nombre',{exact:true}).fill('Semillero actualizado');await page.getByRole('button',{name:'Guardar datos'}).click();await expect(page.getByText('Datos del semillero guardados.')).toBeVisible();
  expect(seedbed.responsibleTeacherId).toBe('leader');
  await chooseSection(page, 'Integrantes y delegados');
  await page.getByRole('button',{name:'Asignar delegado: Ana'}).click();await expect(page.getByRole('button',{name:'Quitar delegación: Ana'})).toBeVisible();
  await page.getByLabel('Buscar integrante por nombre').fill('Eva');await page.getByRole('button',{name:'Buscar integrante',exact:true}).click();await page.getByRole('button',{name:'Vincular a Eva'}).click();await expect(page.getByRole('button',{name:'Retirar a Eva'})).toBeVisible();
  await page.getByRole('button',{name:'Retirar a Eva'}).click();await expect(page.getByRole('button',{name:'Retirar a Eva'})).toHaveCount(0);
  await chooseSection(page, 'Actividades');await page.getByLabel('Título',{exact:true}).fill('Taller propio');await page.getByRole('button',{name:'Guardar actividad'}).click();await expect(page.getByRole('button',{name:'Editar Taller propio'})).toBeVisible();
  await page.getByRole('button',{name:'Editar Taller propio'}).click();await page.getByLabel('Estado',{exact:true}).selectOption('finalizada');await page.getByRole('button',{name:'Guardar actividad'}).click();await expect(page.getByText('finalizada · Sin fecha')).toBeVisible();
  await chooseSection(page, 'Eventos');await expect(page.getByText(/Pendiente para el líder: el backend aún no ofrece/)).toBeVisible();
  await page.getByLabel('Título',{exact:false}).fill('Encuentro propio');await page.getByLabel('Descripción',{exact:false}).fill('Encuentro del semillero');await page.getByLabel('Tipo',{exact:false}).fill('Taller');await page.getByLabel('Fecha y hora de inicio',{exact:false}).fill('2027-01-15T10:00');await page.getByLabel('Lugar',{exact:true}).fill('Aula');await page.getByRole('button',{name:'Crear borrador'}).click();await expect(page.getByText('Evento creado como borrador.')).toBeVisible();
  await page.getByRole('button',{name:'Publicar',exact:true}).click();await expect(page.getByText('Estado del evento actualizado.')).toBeVisible();expect(event.status).toBe('publicado');
  await chooseSection(page, 'Solicitudes de ingreso');await chooseSection(page, 'Eventos');await expect(page.getByText('Encuentro propio',{exact:true})).toBeVisible();
  expect(calls.some(c=>c==='GET /api/events'||c.startsWith('GET /api/projects')||c.startsWith('GET /api/admin/members'))).toBe(false);
  await page.locator('main').screenshot({style:'app-dashboard {visibility:hidden !important}',path:`docs/testing/evidence/R20261104-leader/${info.project.name}.png`});
});
