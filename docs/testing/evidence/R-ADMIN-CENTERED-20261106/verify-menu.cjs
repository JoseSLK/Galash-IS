const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();const context=await browser.newContext();const page=await context.newPage({viewport:{width:1440,height:1000}});
 const seed='11111111-1111-4111-8111-111111111111',teacher='22222222-2222-4222-8222-222222222222',student='33333333-3333-4333-8333-333333333333',id='44444444-4444-4444-8444-444444444444';
 let role='admin',forbidden=false,summaryFail=true;const calls=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let projects=[{id,seedbedId:seed,title:'Proyecto API',summary:'Resumen real',researchLine:'Seguridad',status:'Activo',responsibleIds:[teacher],memberIds:[student],startDate:'2026-11-01T00:00:00Z',endDate:null,progress:20,updatedAt:'2026-11-06T12:00:00Z'}];
 const history=[{authorId:teacher,field:'estado',value:'Activo',createdAt:'2026-11-06T12:00:00Z'}];
 await page.route('**/api/**',async r=>{
  const path=new URL(r.request().url()).pathname,method=r.request().method();calls.push(method+' '+path);let data={};
  if(path.endsWith('/users/me')){if(!role)return r.fulfill({status:401,body:'{}'});data={id:role==='docente'?teacher:'admin-test',name:'Admin',role,status:'activo'};}
  else if(path.endsWith('/seedbeds'))data={seedbeds:[{id:seed,name:'Ciberseguridad',researchLine:'Seguridad'}]};
  else if(path.endsWith('/members'))data={members:[{id:teacher,name:'Ana',last_name:'Docente',role:'profesor',status:'activo',visible_publicly:true},{id:student,name:'Luis',last_name:'Estudiante',role:'estudiante',status:'activo',visible_publicly:true}]};
  else if(path==='/api/projects/progress'){if(summaryFail){summaryFail=false;return r.fulfill({status:500,body:'{}'});}data={projects};}
  else if(path.endsWith('/history')){if(!role)return r.fulfill({status:401,body:'{}'});data={history};}
  else if(path.endsWith('/progress')&&method==='PATCH'){if(forbidden)return r.fulfill({status:403,body:'{}'});const v=r.request().postDataJSON();assert.deepEqual(Object.keys(v),['progress']);projects[0]={...projects[0],progress:v.progress};history.push({authorId:teacher,field:'avance',value:String(v.progress),createdAt:'2026-11-06T13:00:00Z'});data=projects[0];}
  else if(path==='/api/projects'&&method==='POST'){const v=r.request().postDataJSON();assert.equal(v.seedbedId,seed);assert.deepEqual(v.responsibleIds,[teacher]);assert.deepEqual(v.memberIds,[student]);assert.equal(v.startDate,'2026-11-06T00:00:00Z');assert.equal(v.endDate,null);assert.equal(v.researchLine,'Seguridad');assert.ok(!('attachments'in v));data={...v,id:'55555555-5555-4555-8555-555555555555',updatedAt:'2026-11-06T14:00:00Z'};projects.push(data);}
  else if(path==='/api/projects')data={projects};
  else if(path.startsWith('/api/projects/')){const pid=path.split('/').at(-1),index=projects.findIndex(p=>p.id===pid);if(index<0)return r.fulfill({status:404,body:'{}'});if(method==='PATCH'){if(forbidden)return r.fulfill({status:403,body:'{}'});projects[index]={...projects[index],...r.request().postDataJSON()};}data=projects[index];}
  return r.fulfill({status:method==='POST'?201:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 const admin=async()=>{await page.goto('http://127.0.0.1:4200/administracion');await page.getByRole('navigation',{name:'Secciones de administración'}).getByRole('button',{name:'Proyectos',exact:true}).click();await page.locator('app-project-detail h2').waitFor();};

 await admin();
 for(const width of [1440,1024,390,320]){
  await page.setViewportSize({width,height:900});
  const nav=page.locator('#admin-sections');
  assert.ok(await nav.evaluate(el=>el.scrollHeight<=el.clientHeight));
  assert.equal(await nav.evaluate(el=>getComputedStyle(el).overflowY),'visible');
  for(const button of await nav.getByRole('button').all())assert.equal(await button.evaluate(el=>getComputedStyle(el).textAlign),'center');
  await nav.getByRole('button',{name:'Comunicados y cronograma',exact:true}).scrollIntoViewIfNeeded();
  assert.ok(await nav.getByRole('button',{name:'Comunicados y cronograma',exact:true}).isVisible());
  await page.evaluate(()=>scrollTo(0,0));

  assert.equal(await nav.getByRole('button',{name:'Proyectos',exact:true}).getAttribute('aria-current'),'page');
  const dot=await nav.locator('.current-section').evaluate(el=>{const s=getComputedStyle(el,'::after');return {width:s.width,bottom:s.bottom,bg:s.backgroundColor}});assert.equal(dot.width,'5px');assert.equal(dot.bottom,'6px');
  await page.getByRole('button',{name:'Ocultar menú',exact:true}).click();await page.waitForTimeout(300);
  assert.equal(await nav.isVisible(),false);assert.equal(await nav.getAttribute('inert'),'');
  assert.ok(await nav.evaluate(el=>el.getBoundingClientRect().right<=0));
  const show=page.getByRole('button',{name:'Mostrar menú',exact:true});assert.equal(await show.getAttribute('aria-expanded'),'false');
  await page.screenshot({path:__dirname+'/collapsed-'+width+'.png'});
  await show.focus();await page.keyboard.press('Enter');await page.waitForTimeout(300);assert.equal(await nav.isVisible(),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:__dirname+'/expanded-'+width+'.png'});
 }
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS arrow toggle, keyboard, offscreen/inert collapsed menu, active dot, desktop/mobile and overflow');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
