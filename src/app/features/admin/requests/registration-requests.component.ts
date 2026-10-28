import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NEXT_STATES, RegistrationDetail, RegistrationRequest, RegistrationRequestsService, RequestState } from './registration-requests.service';
import { joinSteps } from '../../join-request/join-request.catalog';
import { JOIN_REQUEST_FIELDS } from '../../join-request/join-request.service';
import { SeedbedsService } from '../../seedbeds/seedbeds.service';

type RequestFilter = 'pending' | 'all' | 'resolved';

@Component({
  selector: 'app-registration-requests', standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './registration-requests.component.html',
  styleUrl: './registration-requests.component.css'
})
export class RegistrationRequestsComponent implements OnDestroy {
  @ViewChild('reviewDialog') private dialog?: ElementRef<HTMLDialogElement>;
  private readonly detector = inject(ChangeDetectorRef);
  readonly service = inject(RegistrationRequestsService);
  private readonly seedbedsService = inject(SeedbedsService);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly seedbedNames = signal<ReadonlyMap<string, string>>(new Map());
  readonly filter = signal<RequestFilter>('pending');
  readonly selected = signal<RegistrationDetail | null>(null);
  readonly observation = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] });
  readonly decisionError = signal('');
  readonly feedback = signal('');
  readonly saving = signal(false);
  readonly pending = computed(() => this.service.requests().filter(item => !this.isResolved(item.estado)).length);
  readonly resolved = computed(() => this.service.requests().filter(item => this.isResolved(item.estado)).length);
  readonly visible = computed(() => this.service.requests().filter(item => this.filter() === 'all'
    || (this.filter() === 'pending' ? !this.isResolved(item.estado) : this.isResolved(item.estado))));
  readonly formFields = joinSteps.flatMap(step => step.fields).filter(field => !field.optional);
  private returnFocus?: HTMLButtonElement;
  private previousOverflow = '';
  private scrollLocked = false;

  constructor() { void this.load(); }

  async load(): Promise<void> {
    this.loadState.set('loading');
    try {
      const [, seedbeds] = await Promise.all([this.service.load(), this.seedbedsService.list().catch(() => [])]);
      this.seedbedNames.set(new Map(seedbeds.map(seedbed => [seedbed.id, seedbed.name])));
      this.loadState.set('ready');
    } catch {
      this.loadState.set('error');
    }
  }

  isResolved(state: RequestState): boolean { return NEXT_STATES[state]?.length === 0; }
  nextStates(state: RequestState): readonly RequestState[] { return NEXT_STATES[state] ?? []; }
  stateClass(state: RequestState): string { return this.isResolved(state) ? 'resolved' : 'pending'; }
  seedbedName(item: RegistrationRequest): string {
    return item.seedbedId ? this.seedbedNames().get(item.seedbedId) ?? 'Semillero no publicado' : 'Solo al grupo';
  }
  initials(name: string): string { return name.split(/\s+/).slice(0, 2).map(word => word[0]).join(''); }

  async open(item: RegistrationRequest, trigger: HTMLButtonElement): Promise<void> {
    this.feedback.set('');
    try {
      this.selected.set(await this.service.detail(item.id));
    } catch {
      this.feedback.set(`No se pudo cargar la solicitud de ${item.nombre}. Inténtalo de nuevo.`);
      return;
    }
    this.observation.reset();
    this.decisionError.set('');
    this.returnFocus = trigger;
    this.detector.detectChanges();
    this.dialog?.nativeElement.showModal();
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.scrollLocked = true;
  }
  close(): void { this.dialog?.nativeElement.close(); }
  async decide(state: RequestState): Promise<void> {
    const item = this.selected();
    if (!item || this.saving() || !this.nextStates(item.estado).includes(state)) return;
    const reason = this.observation.value.trim();
    // The backend requires an observation for every state change.
    if (this.observation.invalid || !reason) {
      this.decisionError.set(this.observation.hasError('maxlength')
        ? 'La observación no puede superar los 1000 caracteres.' : 'Escribe una observación para registrar el cambio.');
      document.getElementById('request-observation')?.focus();
      return;
    }
    this.saving.set(true);
    try {
      await this.service.changeState(item.id, state, reason);
      this.feedback.set(`Solicitud de ${item.nombre}: ${state}.`);
      this.close();
    } catch (error: unknown) {
      this.decisionError.set(error instanceof HttpErrorResponse && error.status === 400
        ? 'El cambio no es válido para el estado actual. Recarga la lista.'
        : 'No se pudo guardar el cambio. Inténtalo de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }
  afterClose(): void {
    this.releaseScroll();
    this.selected.set(null);
    if (this.returnFocus?.isConnected) this.returnFocus.focus({ preventScroll: true });
    else document.getElementById('admin-screen-title')?.focus({ preventScroll: true });
  }
  dismissBackdrop(event: MouseEvent): void {
    const dialog = this.dialog?.nativeElement;
    if (!dialog || event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.close();
  }
  private releaseScroll(): void {
    if (this.scrollLocked) document.body.style.overflow = this.previousOverflow;
    this.scrollLocked = false;
  }
  ngOnDestroy(): void { this.close(); this.releaseScroll(); }

  formValue(key: string, item: RegistrationRequest): string {
    const value = item[JOIN_REQUEST_FIELDS[key]];
    if (key === 'birthDate' && typeof value === 'string') return value.slice(0, 10).split('-').reverse().join('/');
    return typeof value === 'string' && value ? value : 'Sin indicar';
  }
}
