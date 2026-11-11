import {Injectable,inject,signal} from '@angular/core';
import {ApiService} from '../../../core/services/api.service';
export interface Adjunto {name:string;url:string;}
type TipoReunion='reunion'|'tutoria'|'hito';
interface AnnouncementApi {id:string;title:string;description:string;attachments:Adjunto[]|null;status:'borrador'|'publicado';authorId:string;authorName?:string;createdAt:string;publishedAt?:string;readConfirmed:boolean;}
interface CalendarApi {id:string;seedbedId:string;type:TipoReunion;title:string;description?:string;startAt:string;endAt:string;participantIds:string[];participants?:{id:string;name:string;lastName:string}[];status:string;}
export interface Lectura {userId:string;name:string;email:string;status:string;confirmedAt?:string;}
export interface NuevaReunion {seedbedId:string;type:TipoReunion;title:string;description:string;startAt:string;endAt:string;participantIds:string[];}
// View model shared by the agenda list and the month calendar; not an API payload.
export interface ComunicadoAgenda {id:string;tipo:'comunicado'|'reunion';categoria:string;titulo:string;descripcion:string;fecha:string;inicio:string;fin:string;adjuntos:Adjunto[];leido:boolean;borrador:boolean;autor:string;authorId?:string;seedbedId:string;participantes:string[];fechaFin?:string;calendarType?:TipoReunion;participantIds?:string[];participantOptions?:{userId:string;name:string;lastName:string;role:string}[];status?:string;}
export const fechaLocal=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const horaLocal=(date:Date)=>`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
const TIPOS:Record<TipoReunion,string>={reunion:'Reunión',tutoria:'Tutoría',hito:'Hito'};
@Injectable({providedIn:'root'})
export class ComunicadosService {
 private readonly api=inject(ApiService);
 readonly items=signal<ComunicadoAgenda[]>([]);
 private loadRequest=0;
 // Announcements are not ranged by the API, so they load whole; meetings load for the visible month.
 async cargar(mes:Date,comunicados=true,seedbedId=''):Promise<void>{
  const request=++this.loadRequest;
  const from=new Date(mes.getFullYear(),mes.getMonth(),1),to=new Date(mes.getFullYear(),mes.getMonth()+1,1,0,0,-1);
  const query=`from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&view=month${seedbedId?'&seedbedId='+encodeURIComponent(seedbedId):''}`;
  const [avisos,agenda]=await Promise.all([comunicados?this.api.get<{announcements:AnnouncementApi[]|null}>('/announcements'):Promise.resolve({announcements:[]}),this.api.get<{events:CalendarApi[]|null}>(`/internal-calendar/events?${query}`)]);
  if(request!==this.loadRequest)return;
  this.items.set([...(avisos.announcements??[]).map(a=>this.comunicado(a)),...(agenda.events??[]).filter(e=>e.status!=='cancelado').map(e=>this.reunion(e))]);
 }
 async crearComunicado(title:string,description:string,attachments:Adjunto[]):Promise<ComunicadoAgenda>{return this.agregar(this.comunicado(await this.api.post<AnnouncementApi,object>('/announcements',{title,description,attachments})));}
 async detalleComunicado(id:string):Promise<ComunicadoAgenda>{return this.reemplazar(this.comunicado(await this.api.get<AnnouncementApi>(`/announcements/${encodeURIComponent(id)}`)));}
 async editarComunicado(id:string,title:string,description:string,attachments:Adjunto[]):Promise<ComunicadoAgenda>{return this.reemplazar(this.comunicado(await this.api.patch<AnnouncementApi,object>(`/announcements/${encodeURIComponent(id)}`,{title,description,attachments})));}
 async publicar(id:string):Promise<void>{this.reemplazar(this.comunicado(await this.api.post<AnnouncementApi,object>(`/announcements/${encodeURIComponent(id)}/publish`,{})));}
 async leer(id:string):Promise<void>{await this.api.post(`/announcements/${encodeURIComponent(id)}/read-confirmations`,{});this.items.update(items=>items.map(item=>item.id===id?{...item,leido:true}:item));}
 async lecturas(id:string):Promise<Lectura[]>{return (await this.api.get<{readStatus:Lectura[]|null}>(`/announcements/${encodeURIComponent(id)}/read-status`)).readStatus??[];}
 async crearReunion(data:NuevaReunion):Promise<ComunicadoAgenda>{return this.agregar(this.reunion(await this.api.post<CalendarApi,NuevaReunion>('/internal-calendar/events',data)));}
 async detalleReunion(id:string):Promise<ComunicadoAgenda>{return this.reemplazar(this.reunion(await this.api.get<CalendarApi>(`/internal-calendar/events/${encodeURIComponent(id)}`)));}
 async editarReunion(id:string,data:Omit<NuevaReunion,'seedbedId'>):Promise<ComunicadoAgenda>{return this.reemplazar(this.reunion(await this.api.patch<CalendarApi,typeof data>(`/internal-calendar/events/${encodeURIComponent(id)}`,data)));}
 async cancelarReunion(id:string):Promise<void>{await this.api.delete(`/internal-calendar/events/${encodeURIComponent(id)}`);this.items.update(items=>items.filter(item=>item.id!==id));}
 private agregar(item:ComunicadoAgenda):ComunicadoAgenda{this.items.update(items=>[...items,item]);return item;}
 private reemplazar(item:ComunicadoAgenda):ComunicadoAgenda{this.items.update(items=>items.map(old=>old.id===item.id?item:old));return item;}
 private comunicado(a:AnnouncementApi):ComunicadoAgenda{const date=new Date(a.publishedAt??a.createdAt);return {id:a.id,tipo:'comunicado',categoria:a.status==='borrador'?'Borrador':'Comunicado',titulo:a.title,descripcion:a.description,fecha:fechaLocal(date),inicio:'',fin:'',adjuntos:a.attachments??[],leido:a.readConfirmed,borrador:a.status==='borrador',autor:a.authorName??'',authorId:a.authorId,seedbedId:'',participantes:[]};}
 private reunion(e:CalendarApi):ComunicadoAgenda{const start=new Date(e.startAt),end=new Date(e.endAt);return {id:e.id,tipo:'reunion',categoria:TIPOS[e.type]??e.type,titulo:e.title,descripcion:e.description??'',fecha:fechaLocal(start),inicio:horaLocal(start),fin:horaLocal(end),adjuntos:[],leido:false,borrador:false,autor:'',seedbedId:e.seedbedId,fechaFin:fechaLocal(end),calendarType:e.type,participantIds:e.participantIds??[],status:e.status,participantOptions:(e.participantIds??[]).map(id=>{const p=e.participants?.find(p=>p.id===id);return {userId:id,name:p?.name??'Participante sin nombre disponible',lastName:p?.lastName??'',role:''};}),participantes:(e.participants??[]).map(p=>[p.name,p.lastName].filter(Boolean).join(' '))};}
}
