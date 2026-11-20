import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { MembersAdminService } from '../members-admin.service';
import { AuditFilter, AuditLog, AuditLogsService } from './audit-logs.service';

// Backend records action as "METHOD /path" and entity as the path; its filters are exact matches,
// so module/operation/result/text are filtered locally over the loaded period.
const MODULES: [prefix: string, label: string][] = [
  ['/users/', 'Usuarios y roles'], ['/seedbeds', 'Semilleros'], ['/admin/registration-requests', 'Solicitudes de ingreso'],
  ['/registration-requests', 'Solicitudes de ingreso'], ['/activities', 'Actividades'], ['/projects', 'Proyectos'],
  ['/research-proposals', 'Propuestas'], ['/events', 'Noticias'], ['/admin/content/', 'Contenido'],
  ['/announcements', 'Comunicados'], ['/internal-calendar/', 'Cronograma'], ['/links', 'Enlaces']
];
const OPERATIONS: Record<string, string> = { POST: 'Creación', PUT: 'Actualización', PATCH: 'Actualización', DELETE: 'Eliminación' };
export const MAX_DAYS = 31;
const PAGE_SIZE = 25;

export const moduleOf = (entity: string): string => MODULES.find(([prefix]) => entity.startsWith(prefix))?.[1] ?? 'Otro';
export const operationOf = (action: string): string => OPERATIONS[action.split(' ')[0]] ?? 'Otra';
const day = (date: Date): string => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const daysBetween = (from: string, to: string): number => Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;

export interface AuditRow extends AuditLog { module: string; operation: string; actorName: string; }

@Component({
  selector: 'app-audit-admin', standalone: true, imports: [DatePipe],
  templateUrl: './audit-admin.component.html',
  styleUrl: './audit-admin.component.css'
})
export class AuditAdminComponent {
  private readonly service = inject(AuditLogsService);
  readonly members = inject(MembersAdminService);
  readonly auth = inject(AuthService);
  readonly maxDays = MAX_DAYS;
  readonly today = day(new Date());

  // Server query (costs a request).
  readonly from = signal(day(new Date(Date.now() - 6 * 86400000)));
  readonly to = signal(this.today);
  readonly actor = signal('');
  readonly pending = signal<{ from: string; to: string; actor: string } | null>(null);
  private lastKey = '';

  // Local filters (no request).
  readonly module = signal('');
  readonly operation = signal('');
  readonly result = signal('');
  readonly text = signal('');
  readonly page = signal(0);

  readonly logs = signal<AuditLog[]>([]);
  readonly loaded = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');

  readonly actors = computed(() => [...this.members.people()].sort((a, b) => a.name.localeCompare(b.name, 'es')));
  readonly rangeError = computed(() => {
    const from = this.from(), to = this.to();
    if (!from || !to) return 'Elige fecha inicial y final.';
    if (from > to) return 'La fecha inicial no puede ser posterior a la final.';
    if (to > this.today) return 'La fecha final no puede ser futura.';
    return daysBetween(from, to) > MAX_DAYS ? `El periodo máximo es de ${MAX_DAYS} días.` : '';
  });
  readonly rows = computed<AuditRow[]>(() => {
    const names = new Map(this.members.people().map(person => [person.id, person.name]));
    return this.logs().map(log => ({ ...log, module: moduleOf(log.entity), operation: operationOf(log.action), actorName: names.get(log.actorId) || log.actorId || 'Sistema' }));
  });
  readonly moduleOptions = computed(() => [...new Set(this.rows().map(row => row.module))].sort());
  readonly filtered = computed(() => {
    const text = this.text().trim().toLowerCase();
    return this.rows().filter(row =>
      (!this.module() || row.module === this.module()) &&
      (!this.operation() || row.operation === this.operation()) &&
      (!this.result() || row.result === this.result()) &&
      (!text || `${row.actorName} ${row.action} ${row.entityId ?? ''} ${row.origin ?? ''}`.toLowerCase().includes(text)));
  });
  readonly failures = computed(() => this.filtered().filter(row => row.result !== 'success').length);
  readonly pages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly visible = computed(() => this.filtered().slice(this.page() * PAGE_SIZE, (this.page() + 1) * PAGE_SIZE));

  setQuery(field: 'from' | 'to' | 'actor', value: string): void { this[field].set(value); this.pending.set(null); this.notice.set(''); }
  setLocal(field: 'module' | 'operation' | 'result' | 'text', value: string): void { this[field].set(value); this.page.set(0); }
  clearLocal(): void { for (const field of ['module', 'operation', 'result', 'text'] as const) this[field].set(''); this.page.set(0); }

  // Step 1: review what will be requested.
  prepare(): void {
    this.notice.set('');
    if (!this.auth.isAdmin() || this.rangeError()) return;
    const query = { from: this.from(), to: this.to(), actor: this.actor() };
    if (this.loaded() && JSON.stringify(query) === this.lastKey) { this.notice.set('Estos datos ya están cargados; usa los filtros de resultados.'); return; }
    this.pending.set(query);
  }

  actorLabel(id: string): string { return id ? this.actors().find(person => person.id === id)?.name ?? id : 'Todos los actores'; }

  // Step 2: the only path that calls the API.
  async confirm(): Promise<void> {
    const query = this.pending();
    if (!query || this.loading() || !this.auth.isAdmin()) return;
    this.loading.set(true); this.error.set('');
    const filter: AuditFilter = {
      actor: query.actor,
      // Date inputs are local days; the API expects RFC3339 instants.
      from: new Date(`${query.from}T00:00:00`).toISOString(),
      to: new Date(`${query.to}T23:59:59.999`).toISOString()
    };
    try {
      this.logs.set(await this.service.list(filter));
      this.lastKey = JSON.stringify(query);
      this.loaded.set(true); this.pending.set(null); this.clearLocal();
    } catch (error: unknown) {
      this.error.set(!(error instanceof HttpErrorResponse) ? 'No pudimos cargar la bitácora.'
        : error.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
        : error.status === 403 ? 'Solo un administrador puede consultar la auditoría.'
        : error.status === 400 ? 'El periodo no es válido.'
        : 'No pudimos cargar la bitácora.');
    } finally { this.loading.set(false); }
  }
}
