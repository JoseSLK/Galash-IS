import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { AVISO_ENLACE_TEMPORAL, Integrante, IntegrantesService, enlacePublico, enlaceTemporal, etiquetaTipo, fotoEnAlta } from './integrantes.service';

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
  /** Ancho en px para fuentes que no llenan el marco: se muestran pequeñas y nítidas sobre un fondo desenfocado en vez de estirarlas. 0 = llena el marco. */
  readonly lowWidth = signal(0);
  readonly foto = computed(() => { const url = this.persona()?.fotoUrl; return url ? fotoEnAlta(url) : undefined; });
  readonly persona = computed(() => this.personas().find(persona => persona.id === this.id()));
  readonly index = computed(() => this.personas().findIndex(persona => persona.id === this.id()));
  readonly anterior = computed(() => this.personas()[(this.index() - 1 + this.personas().length) % this.personas().length]);
  readonly siguiente = computed(() => this.personas()[(this.index() + 1) % this.personas().length]);
  readonly nombre = computed(() => this.persona()?.nombre.split(' ')[0] ?? '');
  readonly apellidos = computed(() => this.persona()?.nombre.split(' ').slice(1).join(' ') ?? '');
  readonly safeLink = enlacePublico;
  readonly auth = inject(AuthService);
  readonly editandoFoto = signal(false);
  readonly enlaceFoto = signal('');
  readonly guardandoFoto = signal(false);
  readonly errorFoto = signal('');
  readonly avisoFoto = signal('');
  readonly enlaceTemporal = enlaceTemporal;
  readonly avisoEnlaceTemporal = AVISO_ENLACE_TEMPORAL;
  readonly numero = (value: number): string => String(value).padStart(2,'0');
  get params() { return this.route.snapshot.queryParams; }
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {this.id.set(params.get('id') ?? '');this.imageFailed.set(false);this.lowWidth.set(0);this.cargar();this.focusTitle();});
  }
  cargar(): void {
    this.request?.unsubscribe();this.state.set('loading');
    this.request = this.service.listar().pipe(switchMap(async personas => {
      const persona = personas.find(p => p.id === this.id());
      if (persona) persona.publicaciones = await this.service.publicaciones(persona.id);
      return personas;
    })).subscribe({next:personas => {this.personas.set(personas);this.state.set('ready');this.focusTitle();},error:()=>{this.state.set('error');this.focusTitle();}});
  }
  abrirEdicionFoto(): void { this.enlaceFoto.set(this.persona()?.fotoUrl ?? ''); this.errorFoto.set(''); this.avisoFoto.set(''); this.editandoFoto.set(true); setTimeout(() => document.getElementById('photo-url')?.focus()); }
  cerrarEdicionFoto(): void { if (!this.guardandoFoto()) { this.editandoFoto.set(false); document.getElementById('edit-photo-button')?.focus(); } }
  async guardarFoto(url: string): Promise<void> {
    const persona = this.persona(); url = url.trim();
    if (!persona || this.guardandoFoto()) return;
    if (url) { try { if (!/^https?:$/.test(new URL(url).protocol)) throw Error(); } catch { this.errorFoto.set('Usa un enlace de imagen válido que comience con https://.'); return; } }
    this.guardandoFoto.set(true); this.errorFoto.set('');
    try {
      const saved = await this.service.actualizarFoto(persona.id, url);
      this.personas.update(items => items.map(item => item.id === persona.id ? {...item, fotoUrl: saved || undefined} : item));
      this.imageFailed.set(false); this.lowWidth.set(0); this.editandoFoto.set(false);
      this.avisoFoto.set(saved ? 'Foto actualizada.' : 'Foto quitada.');
    } catch (e) {
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      this.errorFoto.set(status === 400 ? 'El enlace no es válido: usa una URL http o https de máximo 2048 caracteres.' : status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.' : status === 403 ? 'Solo un administrador puede cambiar la foto.' : status === 404 ? 'Este integrante ya no existe.' : 'No pudimos guardar la foto. Inténtalo de nuevo.');
    } finally { this.guardandoFoto.set(false); }
  }
  onPhotoLoad(img: HTMLImageElement): void { if (!this.lowWidth()) this.lowWidth.set(img.naturalWidth < img.clientWidth * .9 ? Math.max(img.naturalWidth * 1.5, 140) : 0); }
  private focusTitle(): void {
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => document.getElementById('perfil-title')?.focus({preventScroll:true}));
  }
  @HostListener('document:keydown.escape', ['$event']) escape(event: KeyboardEvent): void {
    if (this.header()?.registrationOpen) return;
    if (this.editandoFoto()) { event.preventDefault(); this.cerrarEdicionFoto(); return; }
    event.preventDefault(); void this.router.navigate(['/integrantes'],{queryParams:this.params});
  }
  ngOnDestroy(): void {this.request?.unsubscribe();clearTimeout(this.focusTimer);}
}
