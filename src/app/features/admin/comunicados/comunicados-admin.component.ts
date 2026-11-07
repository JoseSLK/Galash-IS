import {ChangeDetectionStrategy,Component,ElementRef,Input,OnInit,ViewChild,computed,inject,signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {FormControl,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import {CalendarioAgendaComponent} from './calendario.component';
import {ComunicadosService,ComunicadoAgenda,Lectura,NuevaReunion,fechaLocal} from './comunicados.service';
import {Seedbed,SeedbedMember,SeedbedsService} from '../../seedbeds/seedbeds.service';
const ADJUNTO=/\.(pdf|docx?|xlsx?)$/i;
@Component({selector:'app-comunicados-admin',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[ReactiveFormsModule,CalendarioAgendaComponent],templateUrl:'./comunicados-admin.component.html',styleUrl:'./comunicados-admin.component.css'})
export class ComunicadosAdminComponent implements OnInit {
 // Set by the leader panel: only that seedbed's schedule, no announcements (M8 is Docente/Admin only).
 @Input() seedbedId='';
 readonly store=inject(ComunicadosService);
 private readonly seedbedsApi=inject(SeedbedsService);
 @ViewChild('editor') editor!:ElementRef<HTMLDialogElement>;
 @ViewChild('detalle') detalle!:ElementRef<HTMLDialogElement>;
 readonly mes=signal(new Date(new Date().getFullYear(),new Date().getMonth(),1));readonly fecha=signal(fechaLocal(new Date()));readonly filtrarDia=signal(false);
 readonly filtro=signal<'todo'|'reunion'|'comunicado'>('todo');readonly tipo=signal<ComunicadoAgenda['tipo']>('reunion');readonly elegido=signal<string|null>(null);readonly error=signal('');readonly feedback=signal('');
 readonly cargando=signal(false);readonly guardando=signal(false);readonly errorCarga=signal('');readonly errorDetalle=signal('');
 readonly semilleros=signal<Seedbed[]>([]);readonly integrantes=signal<SeedbedMember[]>([]);readonly participantes=signal<string[]>([]);readonly lecturas=signal<Lectura[]|null>(null);
 readonly seleccionado=computed(()=>this.store.items().find(p=>p.id===this.elegido()));
 readonly listado=computed(()=>this.store.items().filter(p=>p.fecha.startsWith(fechaLocal(this.mes()).slice(0,7))&&(!this.filtrarDia()||p.fecha===this.fecha())&&(this.filtro()==='todo'||p.tipo===this.filtro())).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.inicio.localeCompare(b.inicio)));
 readonly fechaTexto=computed(()=>new Date(this.fecha()+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'}));
 readonly form=new FormGroup({titulo:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(/\S/)]}),descripcion:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(/\S/)]}),fecha:new FormControl('',{nonNullable:true}),inicio:new FormControl('09:00',{nonNullable:true}),fin:new FormControl('10:00',{nonNullable:true}),categoria:new FormControl<NuevaReunion['type']>('reunion',{nonNullable:true}),semillero:new FormControl('',{nonNullable:true}),adjuntoNombre:new FormControl('',{nonNullable:true}),enlace:new FormControl('',{nonNullable:true})});
 get soloCronograma():boolean{return !!this.seedbedId;}
 ngOnInit():void{if(this.soloCronograma)this.filtro.set('reunion');void this.cargar();void this.seedbedsApi.list().then(items=>this.semilleros.set(items)).catch(()=>undefined);}
 async cargar():Promise<void>{this.cargando.set(true);this.errorCarga.set('');try{await this.store.cargar(this.mes(),!this.soloCronograma,this.seedbedId);}catch(e){this.errorCarga.set(this.mensaje(e,'No pudimos cargar la agenda.'));}finally{this.cargando.set(false);}}
 fechaEtiqueta(fecha:string,full=false):string{return new Date(fecha+'T12:00:00').toLocaleDateString('es-CO',full?{dateStyle:'full'}:{day:'numeric',month:'short'});}
 semilleroNombre(id:string):string{return this.semilleros().find(s=>s.id===id)?.name??'';}
 cambiarMes(delta:number):void{const current=this.mes();const next=new Date(current.getFullYear(),current.getMonth()+delta,1);this.mes.set(next);this.fecha.set(fechaLocal(next));this.filtrarDia.set(false);void this.cargar();}
 elegirDia(fecha:string):void{this.fecha.set(fecha);this.filtrarDia.set(true);}
 nuevo(tipo:ComunicadoAgenda['tipo']):void{this.tipo.set(tipo);this.error.set('');this.participantes.set([]);this.integrantes.set([]);this.form.reset({titulo:'',descripcion:'',fecha:this.fecha(),inicio:'09:00',fin:'10:00',categoria:'reunion',semillero:this.seedbedId,adjuntoNombre:'',enlace:''});if(this.seedbedId)void this.cargarIntegrantes(this.seedbedId);this.editor.nativeElement.showModal();}
 async cargarIntegrantes(id:string):Promise<void>{this.participantes.set([]);this.integrantes.set([]);if(!id)return;try{this.integrantes.set(await this.seedbedsApi.members(id));}catch{this.error.set('No pudimos cargar los integrantes del semillero.');}}
 alternar(userId:string,checked:boolean):void{this.participantes.update(ids=>checked?[...ids,userId]:ids.filter(id=>id!==userId));}
 nombre(m:SeedbedMember):string{return [m.name,m.lastName].filter(Boolean).join(' ');}
 async guardar():Promise<void>{
  this.form.markAllAsTouched();if(this.form.invalid){this.error.set('Completa el título y la descripción.');return;}
  const v=this.form.getRawValue();this.error.set('');
  if(this.tipo()==='reunion'){
   if(!v.semillero){this.error.set('Selecciona el semillero.');return;}
   if(!v.fecha||!v.inicio||!v.fin||v.fin<=v.inicio){this.error.set('Indica la fecha y una hora de fin posterior a la de inicio.');return;}
   if(!this.participantes().length){this.error.set('Selecciona al menos un participante.');return;}
  } else if(v.adjuntoNombre||v.enlace){
   if(!ADJUNTO.test(v.adjuntoNombre.trim())){this.error.set('El adjunto debe llamarse con extensión .pdf, .doc, .docx, .xls o .xlsx.');return;}
   try{if(!/^https?:$/.test(new URL(v.enlace).protocol))throw Error();}catch{this.error.set('Usa un enlace válido que comience con https://.');return;}
  }
  this.guardando.set(true);
  try{
   const item=this.tipo()==='reunion'
    ?await this.store.crearReunion({seedbedId:v.semillero,type:v.categoria,title:v.titulo.trim(),description:v.descripcion.trim(),startAt:new Date(`${v.fecha}T${v.inicio}`).toISOString(),endAt:new Date(`${v.fecha}T${v.fin}`).toISOString(),participantIds:this.participantes()})
    :await this.store.crearComunicado(v.titulo.trim(),v.descripcion.trim(),v.adjuntoNombre?[{name:v.adjuntoNombre.trim(),url:v.enlace.trim()}]:[]);
   this.mes.set(new Date(item.fecha+'T12:00:00'));this.fecha.set(item.fecha);this.filtrarDia.set(false);this.filtro.set(this.soloCronograma?'reunion':'todo');this.editor.nativeElement.close();
   this.feedback.set(item.tipo==='reunion'?'Reunión creada.':'Comunicado guardado como borrador. Publícalo desde su detalle.');
  }catch(e){this.error.set(this.mensaje(e,'No se pudo guardar.',this.tipo()==='reunion'?'Un participante ya tiene otra actividad en ese horario.':undefined));}
  finally{this.guardando.set(false);}
 }
 ver(item:ComunicadoAgenda):void{this.elegido.set(item.id);this.lecturas.set(null);this.errorDetalle.set('');this.detalle.nativeElement.showModal();}
 async accion(fn:()=>Promise<unknown>,ok:string):Promise<void>{this.guardando.set(true);this.errorDetalle.set('');try{await fn();this.feedback.set(ok);}catch(e){this.errorDetalle.set(this.mensaje(e,'No se pudo completar la acción.'));}finally{this.guardando.set(false);}}
 publicar(id:string):void{void this.accion(()=>this.store.publicar(id),'Comunicado publicado.');}
 leer(id:string):void{void this.accion(()=>this.store.leer(id),'Lectura confirmada.');}
 verLecturas(id:string):void{void this.accion(async()=>this.lecturas.set(await this.store.lecturas(id)),'');}
 conflicto(item:ComunicadoAgenda):boolean{return item.tipo==='reunion'&&this.store.items().some(p=>p.id!==item.id&&p.tipo==='reunion'&&p.fecha===item.fecha&&p.inicio<item.fin&&item.inicio<p.fin);}
 private mensaje(e:unknown,fallback:string,conflicto?:string):string{
  if(!(e instanceof HttpErrorResponse))return fallback;
  return e.status===401?'Tu sesión expiró. Vuelve a iniciar sesión.':e.status===403?'No tienes permiso para esta acción.':e.status===409&&conflicto?conflicto:e.status===404?'El elemento ya no existe.':e.status===400?'Revisa los datos: el servidor los rechazó.':fallback;
 }
}
