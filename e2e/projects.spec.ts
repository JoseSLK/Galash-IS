import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {projectApi} from './project-api.fixture';

test('projects API catalog combines state and seedbed filters',async({page})=>{
 await projectApi(page);await page.goto('/proyectos');
 await expect(page.locator('.project-item')).toHaveCount(3);
 await expect(page.locator('#project-title')).toHaveText('Proyecto activo de prueba');
 await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','62');
 const states=page.getByRole('group',{name:'Filtrar por estado'}),seedbeds=page.getByRole('group',{name:'Filtrar por semillero'});
 await states.getByRole('button',{name:'Radicados (1)',exact:true}).click();await expect(page.locator('.project-item')).toHaveCount(1);
 await seedbeds.getByRole('button',{name:'Ciberseguridad',exact:true}).click();await expect(page.getByRole('heading',{name:'No hay proyectos con estos filtros'})).toBeVisible();
 await page.getByRole('button',{name:'Limpiar filtros',exact:true}).click();await expect(page.locator('.project-item')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('public API projects support keyboard selection and accessibility without protected requests',async({page})=>{
 const state=await projectApi(page);await page.goto('/proyectos');await expect(page.locator('.project-item')).toHaveCount(3);
 const second=page.locator('.project-item').nth(1);await second.focus();await page.keyboard.press('Enter');
 await expect(page.locator('#project-title')).toHaveText('Proyecto radicado de prueba');
 const audit=await new AxeBuilder({page}).include('main#contenido').withTags(['wcag2a','wcag2aa']).analyze();expect(audit.violations.map(v=>v.id)).toEqual([]);
 expect(state.calls.some(call=>call.endsWith('/history')||call.endsWith('/projects/progress'))).toBe(false);
});
