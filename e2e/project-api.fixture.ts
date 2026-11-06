import {Page} from '@playwright/test';

export async function projectApi(page: Page, role: string | null = null) {
 const state = {role, userId:'admin-1', calls:[] as string[], writes:[] as any[], projects:[
  {id:'p1',seedbedId:'s1',title:'Proyecto activo de prueba',summary:'Investigación de seguridad',researchLine:'Seguridad',status:'Activo',responsibleIds:['teacher'],memberIds:['student'],startDate:'2026-11-01T00:00:00Z',endDate:null,progress:62,updatedAt:'2026-11-06T12:00:00Z'},
  {id:'p2',seedbedId:'s2',title:'Proyecto radicado de prueba',summary:'Investigación de modelos',researchLine:'Modelos',status:'Radicado',responsibleIds:['teacher'],memberIds:[],startDate:'2026-11-01T00:00:00Z',endDate:null,progress:8,updatedAt:'2026-11-06T12:00:00Z'},
  {id:'p3',seedbedId:'s1',title:'Proyecto finalizado de prueba',summary:'Investigación concluida',researchLine:'Seguridad',status:'Finalizado',responsibleIds:['teacher'],memberIds:[],startDate:'2026-01-01T00:00:00Z',endDate:'2026-10-31T00:00:00Z',progress:100,updatedAt:'2026-11-06T12:00:00Z'}
 ]};
 await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname,method=request.method();state.calls.push(method+' '+path);
  if(path==='/api/users/me')return route.fulfill(state.role?{json:{id:state.userId,name:'Cuenta',role:state.role,status:'activo'}}:{status:401});
  if(path==='/api/admin/members')return route.fulfill({json:{users:[]}});
  if(path==='/api/seedbeds')return route.fulfill({json:{seedbeds:[{id:'s1',name:'Ciberseguridad',researchLine:'Seguridad'},{id:'s2',name:'IA',researchLine:'Modelos'}]}});
  if(path==='/api/members')return route.fulfill({json:{members:[{id:'teacher',name:'Ana',last_name:'Docente',role:'profesor',status:'activo',visible_publicly:true},{id:'student',name:'Luis',last_name:'Estudiante',role:'estudiante',status:'activo',visible_publicly:true}]}});
  if(path.endsWith('/history'))return route.fulfill({json:{history:[{authorId:'teacher',field:'avance',value:'62',createdAt:'2026-11-06T12:00:00Z'}]}});
  if(path==='/api/projects/progress')return route.fulfill({json:{projects:state.projects}});
  if(path==='/api/projects' && method==='POST'){
   const data=request.postDataJSON();state.writes.push(data);const item={...data,id:'created',updatedAt:'2026-11-06T12:00:00Z'};state.projects.push(item);return route.fulfill({status:201,json:item});
  }
  if(path==='/api/projects')return route.fulfill({json:{projects:state.projects}});
  if(path.startsWith('/api/projects/')){
   const id=path.split('/')[3],index=state.projects.findIndex(item=>item.id===id);
   if(index<0)return route.fulfill({status:404});
   if(method==='PATCH'){const data=request.postDataJSON();state.writes.push(data);state.projects[index]={...state.projects[index],...data};}
   return route.fulfill({json:state.projects[index]});
  }
  return route.fulfill({json:{seedbeds:[],requests:[],events:[],members:[]}});
 });
 return state;
}
