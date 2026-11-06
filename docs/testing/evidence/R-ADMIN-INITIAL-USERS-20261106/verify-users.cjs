const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();const context=await browser.newContext();const page=await context.newPage({viewport:{width:1440,height:1000}});
 const seed='11111111-1111-4111-8111-111111111111',teacher='22222222-2222-4222-8222-222222222222',student='33333333-3333-4333-8333-333333333333',id='44444444-4444-4444-8444-444444444444';
 let rejectList=false;const accounts=[{id:'a',firebase_uid:'uid-a',name:'Ana',last_name:'Prueba',email:'ana@example.invalid',role:'docente',status:'activo'},{id:'b',firebase_uid:'uid-b',name:'Beto',last_name:'Prueba',email:'beto@example.invalid',role:'visitante',status:'inactivo'}];let role='admin',forbidden=false,summaryFail=true;const calls=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let projects=[{id,seedbedId:seed,title:'Proyecto API',summary:'Resumen real',researchLine:'Seguridad',status:'Activo',responsibleIds:[teacher],memberIds:[student],startDate:'2026-11-01T00:00:00Z',endDate:null,progress:20,updatedAt:'2026-11-06T12:00:00Z'}];
 const history=[{authorId:teacher,field:'estado',value:'Activo',createdAt:'2026-11-06T12:00:00Z'}];
 await page.route('**/api/**',async r=>{
  const path=new URL(r.request().url()).pathname,method=r.request().method();calls.push(method+' '+path);let data={};
  if(path.endsWith('/users/me')){if(!role)return r.fulfill({status:401,body:'{}'});data={id:role==='docente'?teacher:'admin-test',name:'Admin',role,status:'activo'};}
  else if(path==='/api/admin/members'){
   const q=new URL(r.request().url()).searchParams.get('q');
   if(!q&&rejectList)return r.fulfill({status:400,body:'{}'});
   if(q==='Ana')await new Promise(resolve=>setTimeout(resolve,650));
   data={users:accounts.filter(a=>!q||(a.name+' '+a.email).toLowerCase().includes(q.toLowerCase()))};
  }
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


 await page.goto('http://127.0.0.1:4200/administracion');
 const rows=page.locator('app-people-directory .person-row');const title=page.locator('#person-title');const search=page.getByRole('searchbox',{name:'Buscar por nombre o correo electrónico'});
 await title.waitFor();assert.equal(await rows.count(),2);assert.equal(await title.textContent(),'Ana Prueba');assert.ok(calls.includes('GET /api/admin/members'));
 await search.fill('Beto');await title.filter({hasText:'Beto Prueba'}).waitFor();assert.equal(await rows.count(),1);
 await search.fill('');await title.filter({hasText:'Ana Prueba'}).waitFor();assert.equal(await rows.count(),2);
 await search.fill('Ana');await page.waitForTimeout(350);await search.fill('Beto');await title.filter({hasText:'Beto Prueba'}).waitFor();await page.waitForTimeout(700);assert.equal(await rows.count(),1);assert.equal(await title.textContent(),'Beto Prueba');
 await search.fill('nadie');await page.getByRole('button',{name:'Limpiar filtros',exact:true}).click();await title.filter({hasText:'Ana Prueba'}).waitFor();assert.equal(await rows.count(),2);
 await page.goto('http://127.0.0.1:4200/');await page.goto('http://127.0.0.1:4200/administracion');await title.waitFor();assert.equal(await rows.count(),2);
 await page.screenshot({path:__dirname+'/initial-users.png'});
 rejectList=true;await page.reload();await page.getByText('El servidor aún no permite listar las cuentas sin una búsqueda. La carga inicial requiere actualizar el backend.',{exact:true}).waitFor();assert.equal(await rows.count(),0);assert.equal(await title.count(),0);
 console.log('PASS initial full list/profile, search, clear, stale response, reentry and backend400 clears stale accounts');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
