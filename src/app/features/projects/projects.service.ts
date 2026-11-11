import {AuthService} from '../../core/services/auth.service';
import {ApiService} from '../../core/services/api.service';
import {SeedbedsService} from '../seedbeds/seedbeds.service';
import {IntegrantesService} from '../integrantes/integrantes.service';
import {firstValueFrom} from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { Observable, defer } from 'rxjs';
import { ProjectApi, ProjectEdit, ProjectUpdate, ResearchProject, PROJECT_STATUSES } from './project.model';
@Injectable({providedIn:'root'})
export class ProjectsService {
 private readonly auth=inject(AuthService);
 private readonly api=inject(ApiService);
 private readonly seedbeds=inject(SeedbedsService);
 private readonly members=inject(IntegrantesService);
 private names=new Map<string,string>();private seedbedNames=new Map<string,string>();
 private map(p:ProjectApi):ResearchProject {
  const people=new Map([...(p.responsibles??[]),...(p.members??[])].map(x=>[x.id,x.name] as const));
  const name=(id:string)=>people.get(id)??this.names.get(id)??'Perfil no disponible';
  const members=(p.memberIds??[]).map(userId=>({userId,name:name(userId)}));
  return {...p,progress:p.progress??0,seedbed:this.seedbedNames.get(p.seedbedId)??'Semillero no disponible',responsible:(p.responsibleIds??[]).map(name),responsibleIds:p.responsibleIds??[],members,memberInitials:members.map(p=>p.name.split(/\s+/).slice(0,2).map(s=>s[0]).join('')),startDate:p.startDate??'',endDate:p.endDate??'',director:(p.responsibleIds??[]).map(name).join(' · '),history:[]};
 }
 list():Observable<ResearchProject[]> {return defer(async()=>{
  const [response,seedbeds,members]=await Promise.all([this.api.get<{projects:ProjectApi[]|null}>('/projects'),this.seedbeds.list(),firstValueFrom(this.members.listar())]);
  this.names=new Map(members.map(p=>[p.id,p.nombre]));this.seedbedNames=new Map(seedbeds.map(p=>[p.id,p.name]));
  return (response.projects??[]).map(p=>this.map(p));
 });}
 async detail(id:string):Promise<ResearchProject>{return this.map(await this.api.get<ProjectApi>(`/projects/${encodeURIComponent(id)}`));}

 private payload(data:ProjectEdit) {
  if(!data.title.trim()||!data.summary.trim()||!data.seedbedId||!data.responsibleIds.length)throw new Error('Completa los datos obligatorios y selecciona al menos un director.');
  if(!Number.isInteger(data.progress)||data.progress<0||data.progress>100)throw new Error('El avance debe ser un número entero entre 0 y 100.');
  if(!PROJECT_STATUSES.includes(data.status))throw new Error('Selecciona un estado válido.');
  if(!data.startDate||!Number.isFinite(Date.parse(data.startDate))||(data.endDate&&(!Number.isFinite(Date.parse(data.endDate))||data.endDate<data.startDate)))throw new Error('Revisa las fechas de inicio y fin.');
  return {title:data.title.trim(),summary:data.summary.trim(),seedbedId:data.seedbedId,researchLine:data.researchLine,responsibleIds:[...new Set(data.responsibleIds)],memberIds:[...new Set(data.memberIds)],startDate:data.startDate+'T00:00:00Z',endDate:data.endDate?data.endDate+'T00:00:00Z':null,status:data.status,progress:data.progress};
 }
 async update(id:string,data:ProjectEdit):Promise<ResearchProject>{return this.map(await this.api.patch<ProjectApi,ReturnType<ProjectsService['payload']>>(`/projects/${encodeURIComponent(id)}`,this.payload(data)));}
 async create(data:ProjectEdit):Promise<ResearchProject>{return this.map(await this.api.post<ProjectApi,ReturnType<ProjectsService['payload']>>('/projects',this.payload(data)));}
 async setProgress(id:string,progress:number):Promise<ResearchProject>{
  if(!Number.isInteger(progress)||progress<0||progress>100)throw new Error('El avance debe ser un número entero entre 0 y 100.');
  return this.map(await this.api.patch<ProjectApi,{progress:number}>(`/projects/${encodeURIComponent(id)}/progress`,{progress}));
 }
 async progressSummary():Promise<ResearchProject[]>{
  const {projects}=await this.api.get<{projects:ProjectApi[]|null}>('/projects/progress');
  return (projects??[]).map(p=>this.map(p));
 }
 async history(id:string):Promise<ProjectUpdate[]>{
  const {history}=await this.api.get<{history:{authorId:string;field:string;value:string;createdAt:string}[]|null}>(`/projects/${encodeURIComponent(id)}/history`);
  const fields:Record<string,string>={titulo:'Título',resumen:'Resumen',linea:'Línea de investigación',estado:'Estado',avance:'Avance',responsables:'Directores',integrantes:'Integrantes',fecha_inicio:'Fecha de inicio',fecha_fin:'Fecha de fin'};
  return (history??[]).map(event=>({at:event.createdAt,authorId:event.authorId,author:this.names.get(event.authorId)??(this.auth.backendUser()?.id===event.authorId?this.auth.profileName():'Usuario '+event.authorId.slice(0,8)),action:(fields[event.field]??event.field)+': '+(['responsables','integrantes'].includes(event.field)?event.value.split(',').filter(Boolean).map(id=>this.names.get(id)??'Perfil no disponible').join(' · '):event.value)}));
 }

}
