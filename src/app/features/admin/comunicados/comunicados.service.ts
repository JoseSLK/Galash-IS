import {Injectable,signal} from '@angular/core';
export interface ComunicadoAgenda {id:string;tipo:'comunicado'|'reunion';categoria:string;titulo:string;descripcion:string;fecha:string;inicio:string;fin:string;formato:string;enlace:string;leido:boolean;}
export const fechaLocal=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
@Injectable({providedIn:'root'})
export class ComunicadosService {
 private readonly hoy=new Date();
 readonly items=signal<ComunicadoAgenda[]>([
  this.ejemplo('1','comunicado','Calendario de entrega de informes semestrales',5,'PDF'),
  this.ejemplo('2','comunicado','Formato de presupuesto para proyectos',3,'Excel'),
  this.ejemplo('3','comunicado','Acta del comité de octubre',1,'Word'),
  this.ejemplo('4','reunion','Tutoría proyecto Ciberseguridad',5,'Tutoría','10:00','11:00'),
  this.ejemplo('5','reunion','Avance de proyectos del grupo',6,'Reunión','09:00','10:30'),
  this.ejemplo('6','reunion','Revisión de hitos',10,'Hito','15:00','16:00'),
  this.ejemplo('7','reunion','Comité de investigación',12,'Reunión','08:00','10:00')
 ]);
 private ejemplo(id:string,tipo:ComunicadoAgenda['tipo'],titulo:string,dia:number,categoria:string,inicio='',fin=''):ComunicadoAgenda{return {id,tipo,titulo,categoria,fecha:fechaLocal(new Date(this.hoy.getFullYear(),this.hoy.getMonth(),dia)),descripcion:'Contenido de demostración para organizar las actividades del grupo.',inicio,fin,formato:tipo==='comunicado'?categoria:'',enlace:'',leido:id==='3'};}
 crear(item:Omit<ComunicadoAgenda,'id'|'leido'>):void{this.items.update(items=>[...items,{...item,id:crypto.randomUUID(),leido:false}]);}
 leer(id:string):void{this.items.update(items=>items.map(item=>item.id===id?{...item,leido:true}:item));}
}
