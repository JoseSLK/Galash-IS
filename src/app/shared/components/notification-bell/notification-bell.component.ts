import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ComunicadosService } from '../../../features/admin/comunicados/comunicados.service';

export interface Aviso { id: string; texto: string; cantidad: number; ruta: string; query?: Record<string, string>; detalle?: string[]; }
interface Announcement { id: string; title: string; status: string; readConfirmed: boolean; publishedAt?: string; createdAt: string; }
interface OpenRequest { id: string; estado: string; }
const OPEN_REQUESTS = ['Radicada', 'En revisión', 'Pendiente de información'];
const POLL_MS = 60_000;

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
  // Takes no room in the header when the account has nothing to be notified about.
  host: { '[class.bell-empty-host]': '!aplica()' }
})
export class NotificationBellComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly comunicados = inject(ComunicadosService);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly abierto = signal(false);
  readonly anuncio = signal('');
  private readonly solicitudes = signal(0);
  private readonly resenas = signal(0);
  private readonly sinLeer = signal<Announcement[]>([]);
  private request = 0;
  private lastAnnouncements = new Set<string>();
  private primeraCarga = true;

  readonly esLider = computed(() => !this.auth.isAdmin() && (this.auth.backendUser()?.managed_seedbed_ids ?? []).length > 0);
  // Who has something to be told: admin (requests, reviews), seedbed leaders (their requests), docentes (announcements).
  readonly aplica = computed(() => this.auth.sessionStatus() === 'authenticated' && (this.auth.isAdmin() || this.esLider() || this.auth.hasRole('docente')));
  // A read confirmed elsewhere in this tab (Mi perfil) clears the item without waiting for the next poll.
  private readonly pendientes = computed(() => this.sinLeer().filter(a => !this.comunicados.items().some(item => item.id === a.id && item.leido)));
  readonly avisos = computed<Aviso[]>(() => {
    const items: Aviso[] = [];
    if (this.solicitudes()) items.push(this.auth.isAdmin()
      ? { id: 'solicitudes', texto: 'Postulaciones sin resolver', cantidad: this.solicitudes(), ruta: '/administracion', query: { section: 'requests' } }
      : { id: 'solicitudes', texto: 'Postulaciones sin resolver en tus semilleros', cantidad: this.solicitudes(), ruta: '/gestion-semillero' });
    if (this.resenas()) items.push({ id: 'resenas', texto: 'Reseñas por moderar', cantidad: this.resenas(), ruta: '/administracion', query: { section: 'reviews' } });
    const unread = this.pendientes();
    if (unread.length) items.push({ id: 'comunicados', texto: unread.length === 1 ? 'Comunicado sin leer' : 'Comunicados sin leer', cantidad: unread.length, ruta: '/mi-perfil', detalle: unread.slice(0, 3).map(a => a.title) });
    return items;
  });
  readonly total = computed(() => this.avisos().reduce((sum, item) => sum + item.cantidad, 0));

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => { if (this.aplica()) void this.cargar(); else this.limpiar(); });
    inject(Router).events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed()).subscribe(() => { this.abierto.set(false); if (this.aplica()) void this.cargar(); });
    const timer = setInterval(() => { if (this.aplica() && document.visibilityState === 'visible') void this.cargar(); }, POLL_MS);
    const onVisible = () => { if (this.aplica() && document.visibilityState === 'visible') void this.cargar(); };
    document.addEventListener('visibilitychange', onVisible);
    destroyRef.onDestroy(() => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); });
  }

  async cargar(): Promise<void> {
    const request = ++this.request;
    const admin = this.auth.isAdmin(), lider = this.esLider(), docente = this.auth.hasRole('docente');
    // Each source fails alone: a failed call keeps its previous count instead of hiding the others.
    const [requests, reviews, announcements] = await Promise.allSettled([
      // Leaders query each managed seedbed (leader-panel convention: requests always carry seedbedId).
      admin ? this.api.get<{ requests: OpenRequest[] | null }>('/admin/registration-requests')
        : lider ? Promise.all((this.auth.backendUser()?.managed_seedbed_ids ?? []).map(id => this.api.get<{ requests: OpenRequest[] | null }>(`/admin/registration-requests?seedbedId=${encodeURIComponent(id)}`)))
          .then(lists => ({ requests: lists.flatMap(list => list.requests ?? []) }))
        : Promise.resolve({ requests: [] }),
      admin ? this.api.get<{ reviews: unknown[] | null }>('/admin/seedbed-reviews?status=pendiente') : Promise.resolve({ reviews: [] }),
      docente ? this.api.get<{ announcements: Announcement[] | null }>('/announcements') : Promise.resolve({ announcements: [] })
    ]);
    if (request !== this.request) return;
    if (requests.status === 'fulfilled') this.solicitudes.set(new Set((requests.value.requests ?? []).filter(item => OPEN_REQUESTS.includes(item.estado)).map(item => item.id)).size);
    if (reviews.status === 'fulfilled') this.resenas.set((reviews.value.reviews ?? []).length);
    if (announcements.status === 'fulfilled') {
      const unread = (announcements.value.announcements ?? []).filter(a => a.status === 'publicado' && !a.readConfirmed)
        .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));
      const nuevos = unread.filter(a => !this.lastAnnouncements.has(a.id));
      // Skip the first load: only announcements published while the page is open are "new".
      if (!this.primeraCarga && nuevos.length) this.anuncio.set(`Nuevo comunicado: ${nuevos[0].title}`);
      this.primeraCarga = false;
      this.lastAnnouncements = new Set(unread.map(a => a.id));
      this.sinLeer.set(unread);
    }
  }

  alternar(): void { this.abierto.update(open => !open); if (this.abierto()) this.anuncio.set(''); }

  @HostListener('document:click', ['$event'])
  cerrarFuera(event: MouseEvent): void { if (this.abierto() && !this.host.nativeElement.contains(event.target as Node)) this.abierto.set(false); }

  @HostListener('document:keydown.escape')
  cerrar(): void { if (this.abierto()) { this.abierto.set(false); this.host.nativeElement.querySelector('button')?.focus(); } }

  private limpiar(): void { this.request++; this.solicitudes.set(0); this.resenas.set(0); this.sinLeer.set([]); this.lastAnnouncements.clear(); this.primeraCarga = true; this.anuncio.set(''); this.abierto.set(false); }
}
