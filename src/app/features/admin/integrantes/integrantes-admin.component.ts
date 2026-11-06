import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { USER_ROLES } from '../../../core/models/role.model';
import { MembersAdminService } from '../members-admin.service';
import { DatePipe } from '@angular/common';
import { Seedbed, SeedbedsService } from '../../seedbeds/seedbeds.service';
import { IntegrantesTabla, OrdenIntegrantes } from '../../integrantes/integrantes-tabla.component';
import { Paginador } from '../../integrantes/paginador.component';
import { normalizar } from '../../integrantes/integrantes.service';
import { CandidatoIntegrante, IntegranteAdmin, IntegrantesAdminService } from './integrantes-admin.service';

@Component({selector:'app-integrantes-admin',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,
  imports:[DatePipe,IntegrantesTabla,Paginador],providers:[IntegrantesAdminService],
  templateUrl:'./integrantes-admin.component.html',styleUrl:'./integrantes-admin.component.css'})
export class IntegrantesAdminComponent implements OnDestroy {
  private readonly service = inject(IntegrantesAdminService);
  private readonly seedbedsService = inject(SeedbedsService);
  @ViewChild('confirmDialog') private dialog?: ElementRef<HTMLDialogElement>;
  private readonly accounts = inject(MembersAdminService);
  readonly auth = inject(AuthService);
  private loadId = 0;
  private searchId = 0;
  private searchTimer?: ReturnType<typeof setTimeout>;
  readonly filtro = signal('vigentes');
  readonly guardando = signal(false);
  readonly feedback = signal('');
  readonly accionError = signal('');
  readonly pendiente = signal<{tipo:'estado'|'retirar';persona:IntegranteAdmin;semilleroId:string} | null>(null);
  readonly candidatos = signal<CandidatoIntegrante[]>([]);
  readonly candidateQuery = signal('');
  readonly buscando = signal(false);
  readonly searchMessage = signal('Escribe al menos 2 letras del nombre o correo.');
  readonly roleLabel = (rol: string | null): string => USER_ROLES.find(role => role.id===rol)?.label ?? 'Rol no disponible';
  readonly semilleros = signal<Seedbed[]>([]);
  readonly semilleroId = signal('');
  readonly filas = signal<IntegranteAdmin[]>([]);
  readonly estado = signal<'loading'|'ready'|'error'>('loading');
  readonly consulta = signal('');
  readonly page = signal(1);
  readonly orden = signal<OrdenIntegrantes>('nombre');
  readonly direccion = signal(1);
  readonly semillero = computed(() => this.semilleros().find(item => item.id === this.semilleroId()));
  readonly porId = computed(() => new Map(this.filas().map(persona => [persona.id, persona])));
  readonly filtrados = computed(() => this.filas().filter(p => (this.filtro()==='todos' || (this.filtro()==='retirados' ? !!p.leftAt : !p.leftAt)) && normalizar(p.nombre+' '+p.tipo+' '+p.area).includes(normalizar(this.consulta())))
    .sort((a,b) => this.direccion() * String(a[this.orden()]).localeCompare(String(b[this.orden()]),'es')));
  readonly paginas = computed(() => Math.max(1,Math.ceil(this.filtrados().length/10)));
  readonly pagina = computed(() => Math.min(this.page(),this.paginas()));
  readonly visibles = computed(() => this.filtrados().slice((this.pagina()-1)*10,this.pagina()*10));
  constructor() { void this.cargarSemilleros(); }
  async cargarSemilleros(): Promise<void> {
    this.estado.set('loading');
    try {
      this.semilleros.set(await this.seedbedsService.list());
      if (!this.semilleroId()) this.semilleroId.set(this.semilleros()[0]?.id ?? '');
      await this.cargar();
    } catch { this.estado.set('error'); }
  }
  async cargar(): Promise<void> {
    const semillero = this.semillero();
    const request = ++this.loadId;
    this.estado.set('loading');
    if (!semillero) {this.filas.set([]);this.estado.set('ready');return;}
    try { const filas = await this.service.listar(semillero);if(request===this.loadId){this.filas.set(filas);this.estado.set('ready');} }
    catch {if(request===this.loadId)this.estado.set('error');}
  }
  cambiar(id: string): void {if(this.guardando())return;this.semilleroId.set(id);this.page.set(1);this.feedback.set('');void this.cargar();}
  buscar(query: string): void {this.consulta.set(query);this.page.set(1);}
  ordenar(key: OrdenIntegrantes): void {this.direccion.set(this.orden()===key?-this.direccion():1);this.orden.set(key);this.page.set(1);}
  filtrar(value: string): void {this.filtro.set(value);this.page.set(1);}
  buscarCandidatos(query: string): void {
    this.candidateQuery.set(query);clearTimeout(this.searchTimer);const request=++this.searchId;
    this.candidatos.set([]);this.buscando.set(false);
    if(query.trim().length<2){this.searchMessage.set('Escribe al menos 2 letras del nombre o correo.');return;}
    this.searchMessage.set('');this.buscando.set(true);
    this.searchTimer=setTimeout(async()=>{
      try{const candidates=await this.service.buscar(query);if(request!==this.searchId)return;this.candidatos.set(candidates);this.searchMessage.set(candidates.length?'':'No encontramos cuentas para esta búsqueda.');}
      catch{if(request===this.searchId)this.searchMessage.set('No pudimos buscar las cuentas. Inténtalo de nuevo.');}
      finally{if(request===this.searchId)this.buscando.set(false);}
    },300);
  }
  puedeVincular(persona: CandidatoIntegrante): boolean {
    return persona.activo && (persona.rol==='docente'||persona.rol==='estudiante') && !this.filas().some(p=>p.id===persona.id&&!p.leftAt);
  }
  async vincular(persona: CandidatoIntegrante): Promise<void> {
    const id=this.semilleroId();
    if(!this.auth.isAdmin()||this.guardando()||this.estado()!=='ready'||!id||!this.puedeVincular(persona))return;
    this.guardando.set(true);this.accionError.set('');this.feedback.set('');
    try{await this.service.vincular(id,persona.id);this.feedback.set('Integrante vinculado al semillero.');await this.cargar();}
    catch(error){this.accionError.set(this.mensajeError(error));}
    finally{this.guardando.set(false);}
  }
  confirmar(tipo:'estado'|'retirar',persona:IntegranteAdmin): void {
    if(!this.auth.isAdmin()||this.guardando())return;
    this.pendiente.set({tipo,persona,semilleroId:this.semilleroId()});this.accionError.set('');this.dialog?.nativeElement.showModal();
  }
  cancelar(event?: Event): void {
    if(this.guardando()){event?.preventDefault();return;}
    this.pendiente.set(null);this.accionError.set('');this.dialog?.nativeElement.close();
  }
  async ejecutar(): Promise<void> {
    const action=this.pendiente();if(!action||!this.auth.isAdmin()||this.guardando())return;
    this.guardando.set(true);this.accionError.set('');this.feedback.set('');
    try{
      if(action.tipo==='retirar')await this.service.retirar(action.semilleroId,action.persona.id);
      else await this.accounts.setStatus(action.persona.id,action.persona.estado==='activo'?'inactive':'active');
      this.dialog?.nativeElement.close();this.pendiente.set(null);
      this.feedback.set(action.tipo==='retirar'?'Retiro registrado. El historial se conserva.':'Estado de cuenta actualizado.');
      await this.cargar();
    }catch(error){this.accionError.set(this.mensajeError(error));}
    finally{this.guardando.set(false);}
  }
  private mensajeError(error: unknown): string {
    if(error instanceof HttpErrorResponse){if(error.status===401)return 'La sesión venció. Vuelve a iniciar sesión.';if(error.status===403)return 'No tienes permiso para realizar este cambio.';if(error.status===404)return 'No encontramos la cuenta o el semillero. Actualiza la lista.';}
    return 'No se pudo guardar el cambio. Revisa los datos e inténtalo de nuevo.';
  }
  ngOnDestroy(): void {this.loadId++;this.searchId++;clearTimeout(this.searchTimer);}

}
