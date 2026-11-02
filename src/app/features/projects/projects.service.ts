import {AuthService} from '../../core/services/auth.service';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, delay } from 'rxjs';
import { ProjectEdit, ResearchProject, PROJECT_STATUSES } from './project.model';
const examples: readonly [string,string,ResearchProject['status'],number,string][] = [
 ['Detección de intrusos en redes universitarias','Ciberseguridad','Activo',62,'Seguridad informática'],
 ['Modelo de predicción de deserción estudiantil','IA','Activo',45,'Inteligencia artificial'],
 ['Plataforma de apoyo a la auditoría de TI','WASI','Activo',78,'Auditoría de sistemas'],
 ['Criptografía ligera para dispositivos IoT','Ciberseguridad','Activo',30,'Seguridad informática'],
 ['Asistente conversacional para el semillero','IA','Radicado',8,'Inteligencia artificial'],
 ['Análisis de vulnerabilidades en aplicaciones web','Ciberseguridad','Radicado',12,'Seguridad informática'],
 ['Arquitectura de software para laboratorios','WASI','Finalizado',100,'Arquitectura de software'],
 ['Gestor de contraseñas seguras','Ciberseguridad','Finalizado',100,'Seguridad informática'],
 ['Clasificación de residuos con visión por computador','IA','Finalizado',100,'Visión por computador']
];
@Injectable({providedIn:'root'})
export class ProjectsService {
 private readonly auth=inject(AuthService);
 private readonly state=new BehaviorSubject<ResearchProject[]>(examples.map(([title,seedbed,status,progress,researchLine],index)=>({
   id:'demo-project-'+(index+1),title,seedbed,status,progress,researchLine,
   summary:'[Resumen de ejemplo sobre el problema que atiende el proyecto y lo que se espera lograr con él.]',
   responsible:['[Docente responsable]','[Co-responsable]'],responsibleIds:['demo-teacher-1','demo-teacher-2'],
   members:['AM','JR','SP','LT','DC'].map((initials,i)=>({userId:'demo-member-'+(i+1),name:'Integrante '+initials})),memberInitials:['AM','JR','SP','LT','DC'],history:[],
   startDate:'2026-02-01',endDate:status==='Finalizado'?'2026-10-01':'2026-12-01',updatedAt:'2026-10-12'
  })));
 list():Observable<ResearchProject[]> {return this.state.asObservable().pipe(delay(350));}
 update(id:string,data:ProjectEdit):ResearchProject {
  const current=this.state.value.find(project=>project.id===id);const user=this.auth.backendUser();
  if(!current)throw new Error('El proyecto ya no está disponible.');
  if(!user||!(this.auth.hasRole('admin')||(this.auth.hasRole('docente')&&current.responsibleIds?.includes(user.id))))throw new Error('No tienes autorización para actualizar este proyecto.');
  this.validate(data);
  const at=new Date().toISOString();
  const updated:ResearchProject={...current,...data,title:data.title.trim(),summary:data.summary.trim(),researchLine:data.researchLine.trim(),responsible:[...data.responsible],responsibleIds:[...data.responsibleIds],members:data.members.map(member=>({...member})),memberInitials:data.members.map(member=>member.name.split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('')),updatedAt:at,history:[...(current.history??[]),{at,authorId:user.id,author:this.auth.profileName(),action:'Información y avance actualizados'}]};
  this.state.next(this.state.value.map(project=>project.id===id?updated:project));return updated;
 }
 create(data:ProjectEdit):ResearchProject {
  const user=this.auth.backendUser();if(!user||!this.auth.hasRole('admin'))throw new Error('Solo un administrador puede registrar proyectos aceptados en esta pantalla.');
  this.validate(data);
  if(!data.director?.trim()||!data.problem?.trim()||!data.objectives?.trim()||!data.methodology?.trim())throw new Error('Completa director, problema, objetivos y metodología.');
  const at=new Date().toISOString();
  const project:ResearchProject={...data,id:crypto.randomUUID(),title:data.title.trim(),summary:data.summary.trim(),memberInitials:data.members.map(member=>member.name.split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase()),updatedAt:at,history:[{at,authorId:user.id,author:this.auth.profileName(),action:'Proyecto aceptado registrado'}]};
  this.state.next([...this.state.value,project]);return project;
 }
 private validate(data:ProjectEdit):void {
  if(!Number.isFinite(data.progress)||data.progress<0||data.progress>100)throw new Error('El avance debe estar entre 0 y 100.');
  if(!PROJECT_STATUSES.includes(data.status))throw new Error('Selecciona Radicado, Activo o Finalizado.');
  if(!data.title.trim()||!data.summary.trim()||!data.researchLine.trim()||!data.seedbed.trim()||!data.responsible.length||data.responsible.some(name=>!name.trim()))throw new Error('Completa los datos obligatorios del proyecto.');
  if(!data.startDate||!data.endDate||!Number.isFinite(Date.parse(data.startDate))||!Number.isFinite(Date.parse(data.endDate))||data.endDate<data.startDate)throw new Error('Revisa las fechas de inicio y fin.');
  if(data.members.some(member=>!member.userId.trim()||!member.name.trim())||new Set(data.members.map(member=>member.userId)).size!==data.members.length)throw new Error('Revisa los ID y nombres de los integrantes.');
 }

}
