import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { Integrante, IntegrantesService, TIPOS_INTEGRANTE, normalizar } from './integrantes.service';
import { FILTROS_INICIALES, FiltrosIntegrantes, IntegrantesToolbar } from './integrantes-toolbar.component';
import { RetratoCard } from './retrato-card.component';
import { IntegrantesTabla, OrdenIntegrantes } from './integrantes-tabla.component';
import { Paginador } from './paginador.component';

@Component({selector:'app-integrantes-page', standalone:true, changeDetection:ChangeDetectionStrategy.OnPush,
  imports:[DashboardComponent, SiteFooterComponent, IntegrantesToolbar, RetratoCard, IntegrantesTabla, Paginador],
  templateUrl:'./integrantes-page.component.html', styleUrl:'./integrantes-page.component.css'})
export class IntegrantesPageComponent implements OnDestroy {
  private readonly service = inject(IntegrantesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search = new Subject<string>();
  private request?: Subscription;
  private restoreTimer?: ReturnType<typeof setTimeout>;
  readonly state = signal<'loading'|'ready'|'error'>('loading');
  readonly personas = signal<Integrante[]>([]);
  readonly filtros = signal<FiltrosIntegrantes>({...FILTROS_INICIALES});
  readonly orden = signal<OrdenIntegrantes | ''>('');
  readonly direccion = signal(1);
  readonly size = computed(() => this.filtros().vista === 'tabla' ? 10 : 8);
  readonly filtrados = computed(() => {
    const f = this.filtros(), q = normalizar(f.q);
    return this.personas().filter(p => (!f.tipo || p.tipo === f.tipo) && (!f.sem || p.semilleros.includes(f.sem)) && normalizar([p.nombre,...p.semilleros,p.area].join(' ')).includes(q))
      .sort((a,b) => {
        const key = this.orden();
        if (key) return this.direccion() * String(a[key]).localeCompare(String(b[key]), 'es') || a.nombre.localeCompare(b.nombre,'es');
        return (Number(b.tipo === 'docente') - Number(a.tipo === 'docente')) || a.nombre.localeCompare(b.nombre,'es');
      });
  });
  readonly page = computed(() => Math.min(this.filtros().page, Math.max(1, Math.ceil(this.filtrados().length / this.size()))));
  readonly offset = computed(() => (this.page() - 1) * this.size());
  readonly visibles = computed(() => this.filtrados().slice(this.offset(), this.offset() + this.size()));
  readonly params = computed(() => ({...this.filtros(), page:this.page()}));
  readonly skeletons = Array.from({length:8},(_,i)=>i);
  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(p => {
      const page = Number(p.get('page'));
      this.filtros.set({q:p.get('q') ?? '',tipo:TIPOS_INTEGRANTE.some(opcion => opcion.value === p.get('tipo')) ? p.get('tipo')! : '',sem:p.get('sem') ?? '',vista:p.get('vista') === 'tabla' ? 'tabla' : 'retratos',page:Number.isSafeInteger(page) && page > 0 ? page : 1});
    });
    this.search.pipe(debounceTime(150), takeUntilDestroyed()).subscribe(q => this.actualizar({q,page:1}, true));
    this.cargar();
  }
  buscar(q: string): void { this.search.next(q); }
  actualizar(cambio: Partial<FiltrosIntegrantes>, replaceUrl = false): void {
    const filtros = {...this.filtros(), ...cambio};
    void this.router.navigate([], {relativeTo:this.route,queryParams:filtros,replaceUrl});
  }
  limpiar(): void { this.search.next(''); this.actualizar({...FILTROS_INICIALES, vista:this.filtros().vista}); }
  ordenar(key: OrdenIntegrantes): void { this.direccion.set(this.orden() === key ? -this.direccion() : 1);this.orden.set(key);this.actualizar({page:1}); }
  cargar(): void {
    this.request?.unsubscribe(); this.state.set('loading');
    this.request = this.service.listar().subscribe({next:personas => {
      this.personas.set(personas); this.state.set('ready');
      if (this.page() !== this.filtros().page) this.actualizar({page:this.page()},true);
      const retorno = this.service.retorno;
      if (retorno?.url === this.router.url) this.restoreTimer = setTimeout(() => window.scrollTo({top:retorno.scroll,behavior:'instant'}),50);
    },error:() => this.state.set('error')});
  }
  guardarScroll(): void { this.service.retorno = {url:this.router.url,scroll:window.scrollY}; }
  ngOnDestroy(): void {this.request?.unsubscribe();clearTimeout(this.restoreTimer);}
}
