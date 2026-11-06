import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, switchMap } from 'rxjs';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { Integrante, IntegrantesService, enlacePublico, etiquetaTipo } from './integrantes.service';

@Component({selector:'app-perfil-integrante', standalone:true, changeDetection:ChangeDetectionStrategy.OnPush,
  imports:[DashboardComponent,SiteFooterComponent,RouterLink],templateUrl:'./perfil-integrante.component.html',styleUrl:'./perfil-integrante.component.css'})
export class PerfilIntegranteComponent implements OnDestroy {
  readonly tipoLabel = etiquetaTipo;
  private readonly service = inject(IntegrantesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly header = viewChild(DashboardComponent);
  private request?: Subscription;
  private focusTimer?: ReturnType<typeof setTimeout>;
  readonly state = signal<'loading'|'ready'|'error'>('loading');
  readonly personas = signal<Integrante[]>([]);
  readonly id = signal('');
  readonly imageFailed = signal(false);
  readonly persona = computed(() => this.personas().find(persona => persona.id === this.id()));
  readonly index = computed(() => this.personas().findIndex(persona => persona.id === this.id()));
  readonly anterior = computed(() => this.personas()[(this.index() - 1 + this.personas().length) % this.personas().length]);
  readonly siguiente = computed(() => this.personas()[(this.index() + 1) % this.personas().length]);
  readonly nombre = computed(() => this.persona()?.nombre.split(' ')[0] ?? '');
  readonly apellidos = computed(() => this.persona()?.nombre.split(' ').slice(1).join(' ') ?? '');
  readonly safeLink = enlacePublico;
  readonly numero = (value: number): string => String(value).padStart(2,'0');
  get params() { return this.route.snapshot.queryParams; }
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {this.id.set(params.get('id') ?? '');this.imageFailed.set(false);this.cargar();this.focusTitle();});
  }
  cargar(): void {
    this.request?.unsubscribe();this.state.set('loading');
    this.request = this.service.listar().pipe(switchMap(async personas => {
      const persona = personas.find(p => p.id === this.id());
      if (persona) persona.publicaciones = await this.service.publicaciones(persona.id);
      return personas;
    })).subscribe({next:personas => {this.personas.set(personas);this.state.set('ready');this.focusTitle();},error:()=>{this.state.set('error');this.focusTitle();}});
  }
  private focusTitle(): void {
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => document.getElementById('perfil-title')?.focus({preventScroll:true}));
  }
  @HostListener('document:keydown.escape', ['$event']) escape(event: KeyboardEvent): void {
    if (this.header()?.registrationOpen) return;
    event.preventDefault(); void this.router.navigate(['/integrantes'],{queryParams:this.params});
  }
  ngOnDestroy(): void {this.request?.unsubscribe();clearTimeout(this.focusTimer);}
}
