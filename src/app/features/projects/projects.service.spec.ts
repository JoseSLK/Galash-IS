import '@angular/compiler';
import {Injector,runInInjectionContext} from '@angular/core';
import {describe,it,expect,vi} from 'vitest';
import {firstValueFrom,of} from 'rxjs';
import {AuthService} from '../../core/services/auth.service';
import {ApiService} from '../../core/services/api.service';
import {SeedbedsService} from '../seedbeds/seedbeds.service';
import {IntegrantesService} from '../integrantes/integrantes.service';
import {ProjectsService} from './projects.service';
import {ProjectApi,ProjectEdit} from './project.model';
const input:ProjectEdit={title:' Proyecto ',summary:' Resumen ',seedbedId:'s1',researchLine:'Seguridad',responsibleIds:['teacher','teacher'],memberIds:['student'],startDate:'2026-11-01',endDate:'',status:'Activo',progress:25};
function setup(){
 const record:ProjectApi={...input,id:'p1',title:'Proyecto',summary:'Resumen',responsibleIds:['teacher'],startDate:'2026-11-01T00:00:00Z',endDate:null,updatedAt:'2026-11-06T12:00:00Z'};
 const api={get:vi.fn(async()=>({projects:[record]})),post:vi.fn(async(_path:string,body:object)=>({...record,...body})),patch:vi.fn(async(_path:string,body:object)=>({...record,...body}))};
 const auth={backendUser:()=>({id:'admin'}),profileName:()=> 'Admin de prueba'};
 const store=runInInjectionContext(Injector.create({providers:[{provide:AuthService,useValue:auth},{provide:ApiService,useValue:api},{provide:SeedbedsService,useValue:{list:async()=>[{id:'s1',name:'Semillero'}]}},{provide:IntegrantesService,useValue:{listar:()=>of([{id:'teacher',nombre:'Ana Docente'},{id:'student',nombre:'Luis Estudiante'}])}}]}),()=>new ProjectsService());
 return {store,api,record};
}
describe('Projects API integration',()=>{
 it('loads backend records and resolves the selected member and seedbed names',async()=>{
  const {store,api}=setup();const projects=await firstValueFrom(store.list());expect(api.get).toHaveBeenCalledWith('/projects');expect(projects[0].seedbed).toBe('Semillero');expect(projects[0].responsible).toEqual(['Ana Docente']);expect(projects[0].members).toEqual([{userId:'student',name:'Luis Estudiante'}]);expect(projects[0].endDate).toBe('');
 });
 it('uses the names sent by the backend for people missing from the public directory',async()=>{
  const {store,api,record}=setup();api.get.mockResolvedValueOnce({projects:[{...record,responsibleIds:['hidden-teacher'],memberIds:['hidden-student'],responsibles:[{id:'hidden-teacher',name:'Docente Oculto'}],members:[{id:'hidden-student',name:'Estudiante Oculto'}]}]});
  const projects=await firstValueFrom(store.list());expect(projects[0].responsible).toEqual(['Docente Oculto']);expect(projects[0].members).toEqual([{userId:'hidden-student',name:'Estudiante Oculto'}]);expect(projects[0].director).toBe('Docente Oculto');
 });
 it('posts IDs and UTC dates, deduplicates directors and permits an absent end date',async()=>{
  const {store,api}=setup();await store.create(input);expect(api.post).toHaveBeenCalledWith('/projects',{...input,title:'Proyecto',summary:'Resumen',responsibleIds:['teacher'],startDate:'2026-11-01T00:00:00Z',endDate:null});
 });
 it('rejects invalid progress before writing and accepts both boundaries',async()=>{
  const {store,api}=setup();for(const progress of [-1,101,0.5])await expect(store.setProgress('p1',progress)).rejects.toThrow('0 y 100');expect(api.patch).not.toHaveBeenCalled();await store.setProgress('p1',0);await store.setProgress('p1',100);expect(api.patch).toHaveBeenNthCalledWith(1,'/projects/p1/progress',{progress:0});expect(api.patch).toHaveBeenNthCalledWith(2,'/projects/p1/progress',{progress:100});
 });
 it('rejects invalid dates, status and missing directors before writing',async()=>{
  const {store,api}=setup();await expect(store.update('p1',{...input,endDate:'2025-01-01'})).rejects.toThrow('fechas');await expect(store.update('p1',{...input,status:'Otro' as never})).rejects.toThrow('estado');await expect(store.update('p1',{...input,responsibleIds:[]})).rejects.toThrow('director');expect(api.patch).not.toHaveBeenCalled();
 });
 it('propagates a backend write failure instead of producing local success',async()=>{
  const {store,api}=setup();api.patch.mockRejectedValueOnce(new Error('Forbidden'));await expect(store.update('p1',input)).rejects.toThrow('Forbidden');
 });
});
