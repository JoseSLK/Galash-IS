import {FilesService} from '../../../core/services/files.service';
import {ChangeDetectionStrategy,Component,ElementRef,Input,OnInit,ViewChild,computed,inject,signal} from '@angular/core';
import {AuthService} from '../../../core/services/auth.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FormControl,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import {CalendarioAgendaComponent} from './calendario.component';
import {ComunicadosService,ComunicadoAgenda,Adjunto,Lectura,NuevaReunion,fechaLocal} from './comunicados.service';
import {Seedbed,SeedbedMember,SeedbedsService} from '../../seedbeds/seedbeds.service';
interface ArchivoPendiente {file:File;uploaded?:Adjunto;}
const ADJUNTO=/\.(pdf|docx?|xlsx?)$/i;
@Component({selector:'app-comunicados-admin',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[ReactiveFormsModule,CalendarioAgendaComponent],templateUrl:'./comunicados-admin.component.html',styleUrl:'./comunicados-admin.component.css'})
export class ComunicadosAdminComponent implements OnInit {
 // Set by the leader panel: only that seedbed's schedule, no announcements (M8 is Docente/Admin only).
 @Input() seedbedId='';
 readonly store=inject(ComunicadosService);
 readonly files=inject(FilesService);
 readonly archivosPendientes=signal<ArchivoPendiente[]>([]);readonly subidaActual=signal('');readonly descargando=signal<string|null>(null);
 readonly auth=inject(AuthService);
 readonly editando=signal<ComunicadoAgenda|null>(null);readonly adjuntosActuales=signal<Adjunto[]>([]);readonly detalleCargando=signal(false);readonly detalleListo=signal(false);
 private detailRequest=0;private memberRequest=0;private agendaRequest=0;readonly confirmandoCancelacion=signal(false);readonly participantesCargando=signal(false);
 private readonly seedbedsApi=inject(SeedbedsService);
 @ViewChild('editor') editor!:ElementRef<HTMLDialogElement>;
 @ViewChild('detalle') detalle!:ElementRef<HTMLDialogElement>;
 readonly mes=signal(new Date(new Date().getFullYear(),new Date().getMonth(),1));readonly fecha=signal(fechaLocal(new Date()));readonly filtrarDia=signal(false);
 readonly filtro=signal<'todo'|'reunion'|'comunicado'>('todo');readonly tipo=signal<ComunicadoAgenda['tipo']>('reunion');readonly elegido=signal<string|null>(null);readonly error=signal('');readonly feedback=signal('');
 readonly cargando=signal(false);readonly guardando=signal(false);readonly errorCarga=signal('');readonly errorDetalle=signal('');
 readonly semilleros=signal<Seedbed[]>([]);readonly integrantes=signal<SeedbedMember[]>([]);readonly participantes=signal<string[]>([]);readonly lecturas=signal<Lectura[]|null>(null);
 readonly seleccionado=computed(()=>this.store.items().find(p=>p.id===this.elegido()));
 readonly agendaActiva=computed(()=>this.store.items().filter(item=>item.status!=='cancelado'));
 readonly listado=computed(()=>this.agendaActiva().filter(p=>(!this.seedbedId||p.seedbedId===this.seedbedId)&&p.fecha.startsWith(fechaLocal(this.mes()).slice(0,7))&&(!this.filtrarDia()||p.fecha===this.fecha())&&(this.filtro()==='todo'||p.tipo===this.filtro())).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.inicio.localeCompare(b.inicio)));
 readonly fechaTexto=computed(()=>new Date(this.fecha()+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'}));
 readonly form=new FormGroup({titulo:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(/\S/)]}),descripcion:new FormControl('',{nonNullable:true}),fecha:new FormControl('',{nonNullable:true}),fechaFin:new FormControl('',{nonNullable:true}),inicio:new FormControl('09:00',{nonNullable:true}),fin:new FormControl('10:00',{nonNullable:true}),categoria:new FormControl<NuevaReunion['type']>('reunion',{nonNullable:true}),semillero:new FormControl('',{nonNullable:true}),adjuntoNombre:new FormControl('',{nonNullable:true}),enlace:new FormControl('',{nonNullable:true})});
 get soloCronograma():boolean{return !!this.seedbedId;}
 ngOnInit():void{if(this.soloCronograma)this.filtro.set('reunion');void this.cargar();void this.seedbedsApi.list().then(items=>this.semilleros.set(items)).catch(()=>undefined);}
 async cargar():Promise<void>{const request=++this.agendaRequest;this.cargando.set(true);this.errorCarga.set('');try{await this.store.cargar(this.mes(),!this.soloCronograma,this.seedbedId);}catch(e){if(request===this.agendaRequest)this.errorCarga.set(this.mensaje(e,'No pudimos cargar la agenda.'));}finally{if(request===this.agendaRequest)this.cargando.set(false);}}
 fechaEtiqueta(fecha:string,full=false):string{return new Date(fecha+'T12:00:00').toLocaleDateString('es-CO',full?{dateStyle:'full'}:{day:'numeric',month:'short'});}
 semilleroNombre(id:string):string{return this.semilleros().find(s=>s.id===id)?.name??'';}
 cambiarMes(delta:number):void{const current=this.mes();const next=new Date(current.getFullYear(),current.getMonth()+delta,1);this.mes.set(next);this.fecha.set(fechaLocal(next));this.filtrarDia.set(false);void this.cargar();}
 elegirDia(fecha:string):void{this.fecha.set(fecha);this.filtrarDia.set(true);}
 nuevo(tipo:ComunicadoAgenda['tipo']):void{if(this.guardando())return;this.memberRequest++;this.participantesCargando.set(false);this.form.controls.semillero.enable();this.editando.set(null);this.adjuntosActuales.set([]);this.archivosPendientes.set([]);this.subidaActual.set('');this.tipo.set(tipo);this.error.set('');this.participantes.set([]);this.integrantes.set([]);this.form.reset({titulo:'',descripcion:'',fecha:this.fecha(),inicio:'09:00',fin:'10:00',categoria:'reunion',semillero:this.seedbedId,adjuntoNombre:'',enlace:''});if(this.seedbedId)void this.cargarIntegrantes(this.seedbedId);this.editor.nativeElement.showModal();}
 async cargarIntegrantes(id:string,selected:string[]=[],existing:SeedbedMember[]=[]):Promise<void>{
  const request=++this.memberRequest;this.participantes.set([...selected]);this.integrantes.set(existing);this.participantesCargando.set(false);if(!id)return;this.participantesCargando.set(true);
  try{const members=await this.seedbedsApi.members(id);if(request===this.memberRequest)this.integrantes.set([...members,...existing.filter(p=>!members.some(m=>m.userId===p.userId))]);}
  catch{if(request===this.memberRequest)this.error.set('No pudimos cargar los integrantes del semillero. Conservamos los participantes actuales.');}
  finally{if(request===this.memberRequest)this.participantesCargando.set(false);}
 }
 alternar(userId:string,checked:boolean):void{this.participantes.update(ids=>checked?[...ids,userId]:ids.filter(id=>id!==userId));}
 nombre(m:SeedbedMember):string{return [m.name,m.lastName].filter(Boolean).join(' ');}
 async guardar():Promise<void>{
  if(this.guardando()||this.participantesCargando())return;this.form.markAllAsTouched();if(this.form.invalid){this.error.set('Completa el título y la descripción.');return;}
  const v=this.form.getRawValue();this.error.set('');
  if(this.tipo()==='comunicado'&&!v.descripcion.trim()){this.error.set('Completa la descripción del comunicado.');return;}
  if(this.tipo()==='reunion'){
   if(!v.semillero){this.error.set('Selecciona el semillero.');return;}
   if(!v.fecha||!v.inicio||!v.fin||!Number.isFinite(new Date(`${v.fecha}T${v.inicio}`).getTime())||!Number.isFinite(new Date(`${v.fechaFin||v.fecha}T${v.fin}`).getTime())||new Date(`${v.fechaFin||v.fecha}T${v.fin}`)<=new Date(`${v.fecha}T${v.inicio}`)){this.error.set('Indica la fecha y una hora de fin posterior a la de inicio.');return;}
   if(!this.participantes().length){this.error.set('Selecciona al menos un participante.');return;}
  } else if(v.adjuntoNombre||v.enlace){
   if(!ADJUNTO.test(v.adjuntoNombre.trim())){this.error.set('El adjunto debe llamarse con extensión .pdf, .doc, .docx, .xls o .xlsx.');return;}
   try{if(!/^https?:$/.test(new URL(v.enlace).protocol))throw Error();}catch{this.error.set('Usa un enlace válido que comience con https://.');return;}
  }
  const attachments=[...this.adjuntosActuales(),...(v.adjuntoNombre?[{name:v.adjuntoNombre.trim(),url:v.enlace.trim()}]:[])];
  if(attachments.length+this.archivosPendientes().length>10){this.error.set('Puedes guardar un máximo de 10 adjuntos.');return;}
  const wasEditing=!!this.editando();let draftSaved=false;
  this.guardando.set(true);
  try{
   const meeting:NuevaReunion={seedbedId:v.semillero,type:v.categoria,title:v.titulo.trim(),description:v.descripcion.trim(),startAt:this.tipo()==='reunion'?new Date(`${v.fecha}T${v.inicio}`).toISOString():'',endAt:this.tipo()==='reunion'?new Date(`${v.fechaFin||v.fecha}T${v.fin}`).toISOString():'',participantIds:this.participantes()};
   const {seedbedId,...meetingChanges}=meeting;
   let item:ComunicadoAgenda;
   if(this.tipo()==='reunion'){
    item=this.editando()?await this.store.editarReunion(this.editando()!.id,meetingChanges):await this.store.crearReunion(meeting);
   }else{
    item=this.editando()?await this.store.editarComunicado(this.editando()!.id,v.titulo.trim(),v.descripcion.trim(),attachments):await this.store.crearComunicado(v.titulo.trim(),v.descripcion.trim(),attachments);
    draftSaved=true;this.editando.set(item);this.adjuntosActuales.set(item.adjuntos);
    this.form.patchValue({adjuntoNombre:'',enlace:''});
    // The entity must exist before upload. Save each association before the next upload.
    while(this.archivosPendientes().length){
     let pending=this.archivosPendientes()[0];
     this.subidaActual.set(`Guardando adjunto: ${pending.file.name}`);
     if(!pending.uploaded){
      const uploaded=await this.files.uploadAnnouncement(pending.file,item.id);
      pending={...pending,uploaded:{name:uploaded.name,url:this.files.url(uploaded.id)}};
      const retained=pending;this.archivosPendientes.update(queue=>[retained,...queue.slice(1)]);
     }
     item=await this.store.editarComunicado(item.id,v.titulo.trim(),v.descripcion.trim(),[...this.adjuntosActuales(),pending.uploaded!]);
     this.editando.set(item);this.adjuntosActuales.set(item.adjuntos);this.archivosPendientes.update(queue=>queue.slice(1));
    }
   }
   const cambiaMes=item.fecha.slice(0,7)!==fechaLocal(this.mes()).slice(0,7);
   this.mes.set(new Date(item.fecha+'T12:00:00'));this.fecha.set(item.fecha);this.filtrarDia.set(false);this.filtro.set(this.soloCronograma?'reunion':'todo');this.editor.nativeElement.close();
   this.feedback.set(wasEditing?(item.tipo==='reunion'?'Actividad actualizada.':'Borrador actualizado.'):item.tipo==='reunion'?'Reunión creada.':'Comunicado guardado como borrador. Publícalo desde su detalle.');
   if(cambiaMes)await this.cargar();
  }catch(e){const message=this.mensaje(e,'No se pudo guardar. Inténtalo de nuevo.',this.tipo()==='reunion'?'Un participante ya tiene otra actividad en ese horario.':'El comunicado ya no está en borrador. Abre de nuevo su detalle.');this.error.set((draftSaved?'El borrador está guardado. Los adjuntos pendientes siguen en este formulario; vuelve a guardar para continuar. ':'')+message);}
  finally{this.guardando.set(false);this.subidaActual.set('');}
 }
 async ver(item:ComunicadoAgenda):Promise<void>{
  const request=++this.detailRequest;this.elegido.set(item.id);this.lecturas.set(null);this.errorDetalle.set('');this.detalleListo.set(false);this.confirmandoCancelacion.set(false);this.detalleCargando.set(true);this.detalle.nativeElement.showModal();
  try{if(item.tipo==='comunicado')await this.store.detalleComunicado(item.id);else await this.store.detalleReunion(item.id);if(request===this.detailRequest)this.detalleListo.set(true);}
  catch(e){if(request===this.detailRequest)this.errorDetalle.set(this.mensaje(e,'No pudimos consultar el detalle de la actividad.'));}
  finally{if(request===this.detailRequest)this.detalleCargando.set(false);}
 }
 puedeEditarComunicado(item:ComunicadoAgenda):boolean{return item.borrador&&this.puedeGestionarComunicado(item);}
 editarComunicado(item:ComunicadoAgenda):void{
  if(!this.detalleListo()||this.guardando()||!this.puedeEditarComunicado(item))return;
  this.memberRequest++;this.participantesCargando.set(false);this.archivosPendientes.set([]);this.subidaActual.set('');this.editando.set(item);this.tipo.set('comunicado');this.error.set('');this.adjuntosActuales.set(item.adjuntos.map(a=>({...a})));this.form.reset({titulo:item.titulo,descripcion:item.descripcion,fecha:item.fecha,inicio:'09:00',fin:'10:00',categoria:'reunion',semillero:'',adjuntoNombre:'',enlace:''});this.detalle.nativeElement.close();this.editor.nativeElement.showModal();
 }
 puedeEditarReunion(item:ComunicadoAgenda):boolean{return item.tipo==='reunion'&&item.status!=='cancelado'&&(this.auth.isAdmin()||(!!this.seedbedId&&this.seedbedId===item.seedbedId)||(this.auth.backendUser()?.managed_seedbed_ids??[]).includes(item.seedbedId));}
 async editarReunion(item:ComunicadoAgenda):Promise<void>{
  if(!this.detalleListo()||this.guardando()||!this.puedeEditarReunion(item))return;
  this.archivosPendientes.set([]);this.subidaActual.set('');this.editando.set(item);this.tipo.set('reunion');this.error.set('');this.adjuntosActuales.set([]);
  this.form.reset({titulo:item.titulo,descripcion:item.descripcion,fecha:item.fecha,fechaFin:item.fechaFin||item.fecha,inicio:item.inicio,fin:item.fin,categoria:item.calendarType??'reunion',semillero:item.seedbedId,adjuntoNombre:'',enlace:''});
  this.form.controls.semillero.disable();this.detalle.nativeElement.close();this.editor.nativeElement.showModal();
  await this.cargarIntegrantes(item.seedbedId,item.participantIds??[],item.participantOptions??[]);
 }
 pedirCancelacion(item:ComunicadoAgenda):void{if(this.detalleListo()&&!this.guardando()&&this.puedeEditarReunion(item)){this.errorDetalle.set('');this.confirmandoCancelacion.set(true);}}
 async cancelarReunion():Promise<void>{
  const item=this.seleccionado();if(!item||!this.confirmandoCancelacion()||this.guardando()||!this.puedeEditarReunion(item))return;
  this.guardando.set(true);this.errorDetalle.set('');
  try{await this.store.cancelarReunion(item.id);this.detalle.nativeElement.close();this.elegido.set(null);this.confirmandoCancelacion.set(false);this.feedback.set('Actividad cancelada. Su historial se conserva.');}
  catch(e){this.errorDetalle.set(this.mensaje(e,'No pudimos cancelar la actividad.','La actividad ya fue cancelada. Actualiza la agenda.'));}
  finally{this.guardando.set(false);}
 }
 cerrarDetalle(event?:Event):void{if(this.guardando()){event?.preventDefault();return;}this.detailRequest++;this.detalle.nativeElement.close();}
 async descargarAdjunto(adjunto:Adjunto):Promise<void>{
  const id=this.files.idFromUrl(adjunto.url);if(!id||this.descargando()||!this.detalleListo())return;
  this.descargando.set(adjunto.url);this.errorDetalle.set('');
  try{await this.files.download(id,adjunto.name);}
  catch(e){this.errorDetalle.set(e instanceof HttpErrorResponse&&e.status===404?'El archivo no está disponible o no tienes acceso.':this.mensaje(e,'No pudimos descargar el archivo. Inténtalo de nuevo.'));}
  finally{this.descargando.set(null);}
 }
 seleccionarArchivos(event:Event):void{
  const input=event.target as HTMLInputElement;const selected=Array.from(input.files??[]);input.value='';if(this.guardando()||!selected.length)return;
  this.error.set('');
  for(const file of selected){const error=this.files.documentError(file);if(error){this.error.set(`${file.name}: ${error}`);return;}}
  const additions=selected.filter(file=>!this.archivosPendientes().some(p=>p.file.name===file.name&&p.file.size===file.size&&p.file.lastModified===file.lastModified));
  if(this.adjuntosActuales().length+this.archivosPendientes().length+additions.length+(this.form.controls.adjuntoNombre.value.trim()?1:0)>10){this.error.set('Puedes guardar un máximo de 10 adjuntos por comunicado.');return;}
  this.archivosPendientes.update(queue=>[...queue,...additions.map(file=>({file}))]);
 }
 quitarArchivo(index:number):void{if(!this.guardando())this.archivosPendientes.update(queue=>queue.filter((_,i)=>i!==index));}
 quitarAdjunto(index:number):void{if(!this.guardando())this.adjuntosActuales.update(items=>items.filter((_,i)=>i!==index));}
 cerrarEditor(event?:Event):void{if(this.guardando()){event?.preventDefault();return;}this.editor.nativeElement.close();}
 async accion(fn:()=>Promise<unknown>,ok:string):Promise<void>{if(this.guardando()||!this.detalleListo())return;this.guardando.set(true);this.errorDetalle.set('');try{await fn();this.feedback.set(ok);}catch(e){this.errorDetalle.set(this.mensaje(e,'No se pudo completar la acción.'));}finally{this.guardando.set(false);}}
 publicar(id:string):void{void this.accion(()=>this.store.publicar(id),'Comunicado publicado.');}
 leer(id:string):void{void this.accion(()=>this.store.leer(id),'Lectura confirmada.');}
 puedeGestionarComunicado(item:ComunicadoAgenda):boolean{return item.tipo==='comunicado'&&(this.auth.isAdmin()||!!item.authorId&&item.authorId===this.auth.backendUser()?.id);}
 verLecturas(id:string):void{void this.accion(async()=>this.lecturas.set(await this.store.lecturas(id)),'');}
 conflicto(item:ComunicadoAgenda):boolean{
  if(item.tipo!=='reunion')return false;
  const start=new Date(`${item.fecha}T${item.inicio}`).getTime(),end=new Date(`${item.fechaFin||item.fecha}T${item.fin}`).getTime();
  return this.agendaActiva().some(p=>p.id!==item.id&&p.tipo==='reunion'&&(p.participantIds??[]).some(id=>(item.participantIds??[]).includes(id))&&new Date(`${p.fecha}T${p.inicio}`).getTime()<end&&start<new Date(`${p.fechaFin||p.fecha}T${p.fin}`).getTime());
 }
 private mensaje(e:unknown,fallback:string,conflicto?:string):string{
  if(!(e instanceof HttpErrorResponse))return fallback;
  return e.status===401?'Tu sesión expiró. Vuelve a iniciar sesión.':e.status===403?'No tienes permiso para esta acción.':e.status===409&&conflicto?conflicto:e.status===404?'El elemento ya no existe.':e.status===400?'Revisa los datos: el servidor los rechazó.':fallback;
 }
}
