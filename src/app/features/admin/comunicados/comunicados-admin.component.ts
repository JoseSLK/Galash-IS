import {ChangeDetectionStrategy,Component,ElementRef,ViewChild,computed,inject,signal} from '@angular/core';
import {FormControl,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import {CalendarioAgendaComponent} from './calendario.component';
import {ComunicadosService,ComunicadoAgenda,fechaLocal} from './comunicados.service';
@Component({selector:'app-comunicados-admin',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[ReactiveFormsModule,CalendarioAgendaComponent],templateUrl:'./comunicados-admin.component.html',styleUrl:'./comunicados-admin.component.css'})
export class ComunicadosAdminComponent {
 readonly store=inject(ComunicadosService);
 @ViewChild('editor') editor!:ElementRef<HTMLDialogElement>;
 @ViewChild('detalle') detalle!:ElementRef<HTMLDialogElement>;
 readonly mes=signal(new Date(new Date().getFullYear(),new Date().getMonth(),1));readonly fecha=signal(fechaLocal(new Date()));readonly filtrarDia=signal(false);
 readonly filtro=signal<'todo'|'reunion'|'comunicado'>('todo');readonly tipo=signal<ComunicadoAgenda['tipo']>('reunion');readonly elegido=signal<string|null>(null);readonly error=signal('');readonly feedback=signal('');
 readonly seleccionado=computed(()=>this.store.items().find(p=>p.id===this.elegido()));
 readonly listado=computed(()=>this.store.items().filter(p=>p.fecha.startsWith(fechaLocal(this.mes()).slice(0,7))&&(!this.filtrarDia()||p.fecha===this.fecha())&&(this.filtro()==='todo'||p.tipo===this.filtro())).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.inicio.localeCompare(b.inicio)));
 readonly fechaTexto=computed(()=>new Date(this.fecha()+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'}));
 readonly form=new FormGroup({titulo:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(/\S/)]}),descripcion:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(/\S/)]}),fecha:new FormControl('',{nonNullable:true,validators:Validators.required}),inicio:new FormControl('09:00',{nonNullable:true}),fin:new FormControl('10:00',{nonNullable:true}),categoria:new FormControl('Reunión',{nonNullable:true}),formato:new FormControl('Sin adjunto',{nonNullable:true}),enlace:new FormControl('',{nonNullable:true})});
 fechaEtiqueta(fecha:string,full=false):string{return new Date(fecha+'T12:00:00').toLocaleDateString('es-CO',full?{dateStyle:'full'}:{day:'numeric',month:'short'});}
 cambiarMes(delta:number):void{const current=this.mes();const next=new Date(current.getFullYear(),current.getMonth()+delta,1);this.mes.set(next);this.fecha.set(fechaLocal(next));this.filtrarDia.set(false);}
 elegirDia(fecha:string):void{this.fecha.set(fecha);this.filtrarDia.set(true);}
 nuevo(tipo:ComunicadoAgenda['tipo']):void{this.tipo.set(tipo);this.error.set('');this.form.reset({titulo:'',descripcion:'',fecha:this.fecha(),inicio:'09:00',fin:'10:00',categoria:'Reunión',formato:'Sin adjunto',enlace:''});this.editor.nativeElement.showModal();}
 guardar():void{this.form.markAllAsTouched();if(this.form.invalid){this.error.set('Completa el título, la descripción y la fecha.');return;}const v=this.form.getRawValue();if(this.tipo()==='reunion'&&(!v.inicio||!v.fin||v.fin<=v.inicio)){this.error.set('La hora de fin debe ser posterior a la hora de inicio.');return;}if(v.enlace){try{if(new URL(v.enlace).protocol!=='https:')throw Error();}catch{this.error.set('Usa un enlace válido que comience con https://.');return;}}
 this.store.crear({tipo:this.tipo(),titulo:v.titulo.trim(),descripcion:v.descripcion.trim(),fecha:v.fecha,inicio:this.tipo()==='reunion'?v.inicio:'',fin:this.tipo()==='reunion'?v.fin:'',categoria:this.tipo()==='reunion'?v.categoria:v.formato,formato:this.tipo()==='comunicado'?v.formato:'',enlace:this.tipo()==='comunicado'?v.enlace:''});this.mes.set(new Date(v.fecha+'T12:00:00'));this.fecha.set(v.fecha);this.filtrarDia.set(false);this.filtro.set('todo');this.editor.nativeElement.close();this.feedback.set(this.tipo()==='reunion'?'Reunión creada en esta demostración.':'Comunicado creado en esta demostración.');}
 ver(item:ComunicadoAgenda):void{this.elegido.set(item.id);this.detalle.nativeElement.showModal();}
 conflicto(item:ComunicadoAgenda):boolean{return item.tipo==='reunion'&&this.store.items().some(p=>p.id!==item.id&&p.tipo==='reunion'&&p.fecha===item.fecha&&p.inicio<item.fin&&item.inicio<p.fin);}
}
