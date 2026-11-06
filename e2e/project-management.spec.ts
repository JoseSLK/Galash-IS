import AxeBuilder from '@axe-core/playwright';
import {expect,test} from '@playwright/test';
import {projectApi} from './project-api.fixture';

test('admin edits through API and confirms the automatic completion date',async({page})=>{
 const state=await projectApi(page,'admin');await page.goto('/administracion');
 await page.locator('#admin-sections').getByRole('button',{name:'Proyectos',exact:true}).click();
 await expect(page.locator('#project-title')).toHaveText('Proyecto activo de prueba');
 await page.getByRole('button',{name:'Editar proyecto',exact:true}).click();const dialog=page.locator('dialog[open]');
 await expect(dialog.getByRole('checkbox',{name:'Ana Docente'})).toBeVisible();
 const audit=await new AxeBuilder({page}).include('dialog[open]').withTags(['wcag2a','wcag2aa']).analyze();expect(audit.violations.map(v=>v.id)).toEqual([]);
 await dialog.locator('[formcontrolname=title]').fill('Proyecto actualizado');await dialog.getByLabel('Porcentaje de avance').fill('101');
 await dialog.getByRole('button',{name:'Guardar actualización',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('entre 0 y 100');
 await dialog.getByLabel('Porcentaje de avance').fill('100');await dialog.getByLabel('Estado',{exact:true}).selectOption('Finalizado');
 page.once('dialog',d=>d.dismiss());await dialog.getByRole('button',{name:'Guardar actualización',exact:true}).click();await expect(dialog).toBeVisible();expect(state.writes).toHaveLength(0);
 page.once('dialog',d=>d.accept());await dialog.getByRole('button',{name:'Guardar actualización',exact:true}).click();await expect(dialog).not.toBeVisible();
 await expect(page.locator('#project-title')).toHaveText('Proyecto actualizado');expect(state.writes[0].endDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00Z$/);
 await page.reload();await page.locator('#admin-sections').getByRole('button',{name:'Proyectos',exact:true}).click();await expect(page.locator('.project-item').filter({hasText:'Proyecto actualizado'})).toHaveCount(1);
});

test('admin creates a project without an end date and assigned account reads it in profile',async({page})=>{
 const state=await projectApi(page,'admin');await page.goto('/administracion');await page.locator('#admin-sections').getByRole('button',{name:'Proyectos',exact:true}).click();
 await page.getByRole('button',{name:'Agregar proyecto',exact:true}).click();const dialog=page.locator('dialog[open]');
 await dialog.getByRole('checkbox',{name:'Ana Docente'}).check();await dialog.getByRole('checkbox',{name:'Luis Estudiante'}).check();
 await dialog.locator('[formcontrolname=title]').fill('Proyecto aceptado de prueba');await dialog.locator('[formcontrolname=summary]').fill('Sinopsis de prueba');await dialog.locator('[formcontrolname=seedbedId]').selectOption('s1');await dialog.locator('[formcontrolname=startDate]').fill('2026-11-01');
 await dialog.getByRole('button',{name:'Registrar proyecto aceptado',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.locator('#project-title')).toHaveText('Proyecto aceptado de prueba');expect(state.writes[0].endDate).toBeNull();expect(state.writes[0].responsibleIds).toEqual(['teacher']);expect(state.writes[0].memberIds).toEqual(['student']);
 state.role='estudiante';state.userId='student';await page.goto('/mi-perfil');await expect(page.locator('.my-projects-section .project-item')).toHaveCount(2);
 state.userId='another';await page.reload();await expect(page.getByRole('heading',{name:'Aún no tienes proyectos asignados'})).toBeVisible();
});
