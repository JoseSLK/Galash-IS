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
 await admin();await page.getByText('Estado: Activo',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Ver resumen de avance',exact:true}).click();await page.getByRole('button',{name:'Reintentar resumen',exact:true}).click();await page.getByText('1 proyectos · Avance promedio: 20%',{exact:true}).waitFor();
 const progress=page.getByLabel('Actualizar avance (%)');await progress.fill('101');assert.equal(await page.getByRole('button',{name:'Guardar avance',exact:true}).isDisabled(),true);
 await progress.fill('45');forbidden=true;await page.getByRole('button',{name:'Guardar avance',exact:true}).click();await page.getByText('No tienes permiso para actualizar el avance.',{exact:true}).waitFor();assert.equal(projects[0].progress,20);
 forbidden=false;await progress.fill('45');await page.getByRole('button',{name:'Guardar avance',exact:true}).click();await page.getByText('Avance: 45',{exact:true}).waitFor();assert.equal(projects[0].progress,45);
 await page.getByRole('button',{name:'Actualizar información',exact:true}).click();let dialog=page.locator('dialog[open]');await dialog.getByRole('checkbox',{name:'Ana Docente'}).waitFor();await dialog.locator('[formcontrolname="title"]').fill('Proyecto editado API');forbidden=true;await dialog.getByRole('button',{name:'Guardar actualización',exact:true}).click();await dialog.locator('.error').waitFor();assert.equal(projects[0].title,'Proyecto API');forbidden=false;await dialog.getByRole('button',{name:'Guardar actualización',exact:true}).click();await page.getByRole('heading',{name:'Proyecto editado API',exact:true}).waitFor();
 await page.getByRole('button',{name:'Añadir proyecto aceptado',exact:true}).click();await dialog.getByRole('checkbox',{name:'Ana Docente'}).check();await dialog.getByRole('checkbox',{name:'Luis Estudiante'}).check();await dialog.locator('[formcontrolname="title"]').fill('Proyecto nuevo API');await dialog.locator('[formcontrolname="summary"]').fill('Resumen de prueba');await dialog.locator('[formcontrolname="seedbedId"]').selectOption(seed);await dialog.locator('[formcontrolname="startDate"]').fill('2026-11-06');await dialog.getByRole('button',{name:'Registrar proyecto aceptado',exact:true}).click();await page.getByRole('heading',{name:'Proyecto nuevo API',exact:true}).waitFor();
 await admin();await page.getByRole('button',{name:'Proyecto nuevo API',exact:false}).waitFor();
 await page.screenshot({path:__dirname+'/admin.png',fullPage:true});
 for(const width of [390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 role='';const before=calls.length;await page.goto('http://127.0.0.1:4200/proyectos');await page.locator('app-project-detail h2').waitFor();assert.equal(await page.getByRole('button',{name:'Guardar avance',exact:true}).count(),0);assert.ok(!calls.slice(before).some(p=>p.includes('/history')||p.includes('/projects/progress')));
 assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync(__dirname+'/checks.json',JSON.stringify({status:'pass',checks:['all seven project endpoints','POST/PATCH IDs and UTC dates','reload reads persisted state','403 no false success','progress bounds','summary retry','history and author','anonymous no protected requests','mobile320/390 no overflow'],calls},null,2));
 console.log('PASS all seven endpoints, persistence, progress/history, errors, role gating and mobile');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
