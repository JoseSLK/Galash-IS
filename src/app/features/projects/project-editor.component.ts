import {ChangeDetectionStrategy,Component,ElementRef,ViewChild,inject,output,signal} from '@angular/core';
import {FormControl,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import {firstValueFrom} from 'rxjs';
import {Integrante,IntegrantesService,normalizar} from '../integrantes/integrantes.service';
import {PROJECT_STATUSES,ResearchProject} from './project.model';
import {HttpErrorResponse} from '@angular/common/http';
import {Seedbed,SeedbedsService} from '../seedbeds/seedbeds.service';
import {ProjectsService} from './projects.service';
const text=()=>new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(/\S/)]});
type TipoSeleccion = 'directores' | 'integrantes';
@Component({selector:'app-project-editor',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[ReactiveFormsModule],templateUrl:'./project-editor.component.html',styleUrl:'./project-editor.component.css'})
export class ProjectEditorComponent {
 @ViewChild('dialog',{static:true}) dialog!:ElementRef<HTMLDialogElement>;
 private readonly store=inject(ProjectsService);
 private readonly seedbedsService=inject(SeedbedsService);
 private readonly directory=inject(IntegrantesService);
 private originalStatus:ResearchProject['status']='Activo';private originalEndDate='';private projectId='';private researchLine='';private opener:HTMLElement|null=null;
 readonly saved=output<ResearchProject>();readonly creating=signal(false);readonly semilleros=signal<Seedbed[]>([]);readonly saving=signal(false);readonly error=signal('');readonly statuses=PROJECT_STATUSES;
 readonly personas=signal<Integrante[]>([]);readonly cargando=signal(false);readonly errorPersonas=signal('');
 readonly seleccion=signal<Record<TipoSeleccion,string[]>>({directores:[],integrantes:[]});
 readonly busqueda=signal<Record<TipoSeleccion,string>>({directores:'',integrantes:''});
 readonly tipos:TipoSeleccion[]=['directores','integrantes'];
 readonly form=new FormGroup({title:text(),summary:text(),seedbedId:text(),startDate:text(),endDate:new FormControl('',{nonNullable:true}),status:new FormControl<ResearchProject['status']>('Activo',{nonNullable:true,validators:Validators.required}),progress:new FormControl(0,{nonNullable:true,validators:[Validators.required,Validators.min(0),Validators.max(100),Validators.pattern(/^\d+$/)]})});
 open(project?:ResearchProject):void {
  this.originalStatus=project?.status??'Activo';this.originalEndDate=project?.endDate??'';this.form.controls.seedbedId.enable();this.creating.set(!project);this.projectId=project?.id??'';this.researchLine=project?.researchLine??'';
  this.seleccion.set({directores:[...(project?.responsibleIds??[])],integrantes:(project?.members??[]).map(p=>p.userId)});
  this.busqueda.set({directores:'',integrantes:''});
  this.opener=document.activeElement as HTMLElement;this.error.set('');
  this.form.reset({title:project?.title??'',summary:project?.summary??'',seedbedId:project?.seedbedId??'',startDate:project?.startDate?.slice(0,10)??'',endDate:project?.endDate?.slice(0,10)??'',status:project?.status??'Activo',progress:project?.progress??0});
  this.dialog.nativeElement.showModal();void this.cargarPersonas();
 }
 async cargarPersonas():Promise<void>{
  if(this.cargando())return;
  this.cargando.set(true);this.errorPersonas.set('');
  try{const [personas,semilleros]=await Promise.all([firstValueFrom(this.directory.listar()),this.seedbedsService.list()]);this.personas.set(personas);this.semilleros.set(semilleros);this.form.controls.seedbedId.enable();if(!this.creating())this.form.controls.seedbedId.disable();}
  catch{this.personas.set([]);this.errorPersonas.set('No pudimos cargar las personas del grupo. Inténtalo de nuevo.');}
  finally{this.cargando.set(false);}
 }
 opciones(tipo:TipoSeleccion):Integrante[]{
  const palabras=normalizar(this.busqueda()[tipo]).split(/\s+/).filter(Boolean);
  return this.personas().filter(p=>(tipo==='directores'?p.tipo==='docente':p.tipo!=='docente')&&palabras.every(palabra=>normalizar([p.nombre,...p.semilleros,p.area].join(' ')).includes(palabra)));
 }
 buscar(tipo:TipoSeleccion,query:string):void{this.busqueda.update(value=>({...value,[tipo]:query}));}
 elegir(tipo:TipoSeleccion,id:string):void{this.seleccion.update(value=>({...value,[tipo]:value[tipo].includes(id)?value[tipo].filter(item=>item!==id):[...value[tipo],id]}));}
 faltantes(tipo:TipoSeleccion):string[]{return this.seleccion()[tipo].filter(id=>!this.personas().some(p=>p.id===id));}
 seleccionados(tipo:TipoSeleccion):Integrante[]{return this.personas().filter(p=>this.seleccion()[tipo].includes(p.id));}
 close():void{if(this.saving())return;this.dialog.nativeElement.close();this.opener?.focus();}
 async save():Promise<void>{
  this.form.markAllAsTouched();
  if(this.saving()||this.cargando()||this.errorPersonas())return;
  if(this.form.invalid){this.error.set('Completa los campos obligatorios. El avance debe estar entre 0 y 100.');return;}
  const directores=this.seleccionados('directores').filter(p=>p.tipo==='docente');
  const integrantes=this.seleccionados('integrantes').filter(p=>p.tipo!=='docente');
  if(!directores.length||directores.length!==this.seleccion().directores.length||integrantes.length!==this.seleccion().integrantes.length){this.error.set('Selecciona al menos un docente como director y revisa las personas seleccionadas; deben pertenecer al directorio actual.');return;}
  const data=this.form.getRawValue();const semillero=this.semilleros().find(p=>p.id===data.seedbedId);
  if(!semillero){this.error.set('Selecciona un semillero válido.');return;}
  if(data.status==='Finalizado' && this.originalStatus!=='Finalizado'){
   if(!window.confirm('¿Estás seguro de finalizar este proyecto? Se registrará la fecha de hoy como fecha de finalización.'))return;
   const now=new Date();data.endDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  }else{data.endDate=data.status==='Finalizado'?this.originalEndDate.slice(0,10):'';}
  if(data.endDate && data.endDate<data.startDate){this.error.set('La fecha de inicio no puede ser posterior a la finalización.');return;}
  this.saving.set(true);this.error.set('');
  try{
   const record={...data,researchLine:this.creating()?semillero.researchLine:this.researchLine,responsibleIds:directores.map(p=>p.id),memberIds:integrantes.map(p=>p.id)};
   const project=this.creating()?await this.store.create(record):await this.store.update(this.projectId,record);
   this.saved.emit(project);this.dialog.nativeElement.close();this.opener?.focus();
  }catch(error){this.error.set(error instanceof HttpErrorResponse ? ({400:'Revisa los datos del proyecto.',401:'Tu sesión venció. Vuelve a iniciar sesión.',403:'No tienes permiso para guardar este proyecto.',404:'El proyecto o semillero ya no está disponible.'}[error.status]??'No se pudo guardar el proyecto. Inténtalo nuevamente.') : error instanceof Error?error.message:'No se pudo guardar el proyecto.');}
  finally{this.saving.set(false);}
 }
}
