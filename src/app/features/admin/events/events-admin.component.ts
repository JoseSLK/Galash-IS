import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { EventData, EventStatus, EventsAdminService, ManagedEvent } from './events-admin.service';

const textRequired: ValidatorFn = control => String(control.value ?? '').trim() ? null : { required: true };
const url: ValidatorFn = control => {
  if (!control.value) return null;
  try { return ['https:', 'http:'].includes(new URL(control.value).protocol) ? null : { url: true }; }
  catch { return { url: true }; }
};
function localDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
@Component({
  selector: 'app-events-admin', standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './events-admin.component.html', styleUrl: './events-admin.component.css'
})
export class EventsAdminComponent {
  private readonly service = inject(EventsAdminService);
  readonly auth = inject(AuthService);
  readonly events = signal<ManagedEvent[]>([]);
  readonly selected = signal<ManagedEvent | null>(null);
  readonly creating = signal(false);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly feedback = signal('');
  readonly filter = signal<EventStatus | 'todos'>('todos');
  readonly filters = ['todos', 'borrador', 'publicado', 'oculto', 'cancelado'] as const;
  readonly labels = { todos: 'Todos', borrador: 'Borradores', publicado: 'Publicados', oculto: 'Ocultos', cancelado: 'Cancelados' };
  readonly statusLabels = { borrador: 'Borrador', publicado: 'Publicado', oculto: 'Oculto', cancelado: 'Cancelado' };
  readonly filtered = computed(() => this.events().filter(event => this.filter() === 'todos' || event.status === this.filter()));
  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [textRequired] }),
    description: new FormControl('', { nonNullable: true, validators: [textRequired] }),
    type: new FormControl('', { nonNullable: true, validators: [textRequired] }),
    startAt: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endAt: new FormControl('', { nonNullable: true }),
    venue: new FormControl('', { nonNullable: true }),
    meetingUrl: new FormControl('', { nonNullable: true, validators: [url] }),
    imageUrl: new FormControl('', { nonNullable: true, validators: [url] }),
    registrationUrl: new FormControl('', { nonNullable: true, validators: [url] })
  });
  constructor() { void this.load(); }
  count(status: EventStatus | 'todos'): number { return status === 'todos' ? this.events().length : this.events().filter(event => event.status === status).length; }
  async load(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try { this.events.set(await this.service.list()); }
    catch { this.error.set('No pudimos cargar los eventos. Inténtalo de nuevo.'); }
    finally { this.loading.set(false); }
  }
  private reset(event: ManagedEvent | null): void {
    this.selected.set(event); this.creating.set(!event);
    this.form.reset({ title: event?.title ?? '', description: event?.description ?? '', type: event?.type ?? '', startAt: localDate(event?.startAt), endAt: localDate(event?.endAt), venue: event?.venue ?? '', meetingUrl: event?.meetingUrl ?? '', imageUrl: event?.imageUrl ?? '', registrationUrl: event?.registrationUrl ?? '' });
  }
  async select(event: ManagedEvent): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(''); this.feedback.set('');
    try { this.reset(await this.service.detail(event.id)); }
    catch { this.error.set('No pudimos abrir este evento. Inténtalo de nuevo.'); }
    finally { this.busy.set(false); }
  }
  newEvent(): void {
    if (this.busy()) return;
    this.error.set(''); this.feedback.set(''); this.reset(null);
  }
  setFilter(status: EventStatus | 'todos'): void { this.filter.set(status); }
  private remember(event: ManagedEvent): void {
    this.events.update(items => items.some(item => item.id === event.id) ? items.map(item => item.id === event.id ? event : item) : [event, ...items]);
    this.reset(event);
  }
  async save(): Promise<void> {
    if (this.busy() || !this.auth.isAdmin()) return;
    this.form.markAllAsTouched(); this.error.set(''); this.feedback.set('');
    if (this.form.invalid) { this.error.set('Completa los campos obligatorios y revisa que los enlaces sean válidos.'); return; }
    const value = this.form.getRawValue();
    const start = new Date(value.startAt); const end = value.endAt ? new Date(value.endAt) : null;
    if (Number.isNaN(start.getTime()) || (end && (Number.isNaN(end.getTime()) || end < start))) { this.error.set('La fecha final debe ser igual o posterior al inicio.'); return; }
    if (!value.venue.trim() && !value.meetingUrl.trim()) { this.error.set('Indica un lugar o un enlace virtual.'); return; }
    const data: EventData = { ...value, title: value.title.trim(), description: value.description.trim(), type: value.type.trim(), venue: value.venue.trim(), meetingUrl: value.meetingUrl.trim(), imageUrl: value.imageUrl.trim(), registrationUrl: value.registrationUrl.trim(), startAt: start.toISOString(), endAt: end?.toISOString() ?? null };
    this.busy.set(true);
    try {
      const selected = this.selected();
      const event = selected ? await this.service.update(selected.id, data) : await this.service.create(data);
      this.remember(event); this.feedback.set(selected ? 'Cambios guardados.' : 'Evento creado como borrador.');
    } catch (error: unknown) { this.showError(error); }
    finally { this.busy.set(false); }
  }
  async action(action: 'publish' | 'hide' | 'cancel'): Promise<void> {
    const selected = this.selected();
    if (!selected || this.busy() || !this.auth.isAdmin() || this.form.dirty) return;
    this.busy.set(true); this.error.set(''); this.feedback.set('');
    try { this.remember(await this.service.action(selected.id, action)); this.feedback.set('Estado del evento actualizado.'); }
    catch (error: unknown) { this.showError(error); }
    finally { this.busy.set(false); }
  }
  private showError(error: unknown): void {
    this.error.set(error instanceof HttpErrorResponse && [401, 403].includes(error.status) ? 'No tienes autorización para realizar esta acción.' : error instanceof HttpErrorResponse && [400, 409, 422].includes(error.status) ? 'El servicio rechazó el cambio. Revisa los datos y el estado del evento.' : 'No pudimos guardar el cambio. Conservamos los datos para que puedas intentarlo de nuevo.');
  }
}
