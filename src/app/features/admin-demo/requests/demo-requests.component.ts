import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DemoRequest, DemoRequestsService, RequestState } from './demo-requests.service';
import { AdminDemoAccessService } from '../../../core/services/admin-demo-access.service';
import { joinSteps } from '../../join-request/join-request.catalog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

type RequestFilter = 'pending' | 'all' | 'resolved';

@Component({
  selector: 'app-demo-requests', standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './demo-requests.component.html',
  styleUrl: './demo-requests.component.css'
})
export class DemoRequestsComponent implements OnDestroy {
  @ViewChild('reviewDialog') private dialog?: ElementRef<HTMLDialogElement>;
  private readonly detector = inject(ChangeDetectorRef);
  readonly service = inject(DemoRequestsService);
  readonly access = inject(AdminDemoAccessService);
  readonly filter = signal<RequestFilter>('pending');
  readonly selectedId = signal<string | null>(null);
  readonly observation = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] });
  readonly decisionError = signal('');
  readonly feedback = signal('');
  readonly selected = computed(() => this.service.requests().find(item => item.id === this.selectedId()) || null);
  readonly pending = computed(() => this.service.requests().filter(item => !this.isResolved(item.state)).length);
  readonly resolved = computed(() => this.service.requests().filter(item => this.isResolved(item.state)).length);
  readonly visible = computed(() => this.service.requests().filter(item => this.filter() === 'all'
    || (this.filter() === 'pending' ? !this.isResolved(item.state) : this.isResolved(item.state))));
  readonly formFields = joinSteps.flatMap(step => step.fields).filter(field => !field.optional);
  private returnFocus?: HTMLButtonElement;
  private previousOverflow = '';
  private scrollLocked = false;

  isResolved(state: RequestState): boolean { return state === 'Aprobada' || state === 'Rechazada'; }
  stateClass(state: RequestState): string { return this.isResolved(state) ? 'resolved' : 'pending'; }
  stateLabel(state: RequestState): string { return this.isResolved(state) ? 'Resuelta' : 'Pendiente'; }
  initials(name: string): string { return name.split(/\s+/).slice(0, 2).map(word => word[0]).join(''); }

  open(item: DemoRequest, trigger: HTMLButtonElement): void {
    if (!this.access.allowed()) return;
    this.selectedId.set(item.id);
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
  decide(decision: 'Aprobada' | 'Rechazada'): void {
    const item = this.selected();
    if (!item || !this.access.allowed() || this.isResolved(item.state)) return;
    const reason = this.observation.value.trim();
    if (this.observation.invalid || (decision === 'Rechazada' && !reason)) {
      this.decisionError.set(this.observation.hasError('maxlength')
        ? 'La observación no puede superar los 1000 caracteres.' : 'Escribe un motivo para rechazar la solicitud.');
      document.getElementById('request-observation')?.focus();
      return;
    }
    try {
      this.service.decide(item.id, decision, reason);
      this.feedback.set(`Solicitud ${item.id} ${decision.toLowerCase()} en la demostración.`);
      this.close();
    } catch {
      this.decisionError.set('No se pudo guardar la decisión demo. Revisa el acceso e inténtalo de nuevo.');
    }
  }
  afterClose(): void {
    this.releaseScroll();
    this.selectedId.set(null);
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

  formValue(key: string, item: DemoRequest): string {
    const values: Record<string, string> = {
      fullName: item.name, document: '0000000000 (ejemplo)', studentCode: '0000000 (ejemplo)', phone: '0000000000 (ejemplo)',
      birthDate: '01/01/2004 (ejemplo)', birthPlace: 'Sogamoso (ejemplo)', address: 'Dirección ficticia de ejemplo',
      education: 'Pregrado', educationTitle: 'Formación universitaria (ejemplo)', undergraduateTitle: 'Ingeniería de Sistemas (ejemplo)',
      affiliation: 'Estudiante', cvlac: 'https://example.test/cvlac/demo', orcid: 'https://example.test/orcid/demo',
      researcherCategory: 'Sin categoría', call: 'Sin participación'
    };
    return values[key] || 'Dato de ejemplo';
  }
}
