import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { JoinField, joinSteps } from './join-request.catalog';
import { SeedbedsService } from '../seedbeds/seedbeds.service';
import { JoinRequestReceipt, JoinRequestService } from './join-request.service';

const NO_SEEDBED = { value: '', label: 'Solo al grupo / sin semillero específico' };

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const requiredText: ValidatorFn = control => String(control.value).trim() ? null : { required: true };
const numeric: ValidatorFn = control => !control.value || /^\d+$/.test(control.value) ? null : { numeric: true };
const validUrl: ValidatorFn = control => {
  if (!control.value) return null;
  try { return ['http:', 'https:'].includes(new URL(String(control.value).trim()).protocol) ? null : { url: true }; }
  catch { return { url: true }; }
};

@Component({
  selector: 'app-join-request',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DashboardComponent, SiteFooterComponent],
  templateUrl: './join-request.component.html',
  styleUrl: './join-request.component.css'
})
export class JoinRequestComponent implements AfterViewInit {
  @ViewChild('stepTitle') private stepTitle?: ElementRef<HTMLElement>;
  private readonly detector = inject(ChangeDetectorRef);
  private readonly service = inject(JoinRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly seedbeds = inject(SeedbedsService);
  private readonly seedbedOptions = signal<readonly { value: string; label: string }[]>([NO_SEEDBED]);
  readonly steps = joinSteps;
  readonly form = new FormGroup<Record<string, FormControl<string>>>({});
  readonly maxDate = today();
  step = 0;
  loading = false;
  submitError = '';
  copied = false;
  copyError = '';
  receipt: JoinRequestReceipt | null = null;

  constructor() {
    for (const field of joinSteps.flatMap(section => section.fields)) {
      const validators: ValidatorFn[] = field.optional ? [] : [requiredText];
      if (field.numeric) validators.push(numeric);
      if (field.type === 'url') validators.push(validUrl);
      if (field.key === 'phone') validators.push(control => !control.value || /^\d{7,10}$/.test(control.value) ? null : { phone: true });
      if (field.type === 'date') validators.push(control => !control.value || control.value <= today() ? null : { future: true });
      if (field.type === 'select') validators.push(control => this.options(field).some(option => option.value === control.value) || (!control.value && !field.optional) ? null : { option: true });
      this.form.addControl(field.key, new FormControl('', { nonNullable: true, validators }));
    }
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => void this.preselect(params.get('id') || ''));
  }
  private async preselect(id: string): Promise<void> {
    if (this.seedbedOptions().length === 1) {
      // Without the list the request still works: it goes to the group, not to one seedbed.
      const items = await this.seedbeds.list().catch(() => []);
      this.seedbedOptions.set([NO_SEEDBED, ...items.map(item => ({ value: item.id, label: item.name }))]);
    }
    this.form.controls['seedbed'].setValue(this.options(this.seedbedField).some(option => option.value === id) ? id : '');
  }
  private readonly seedbedField = joinSteps.flatMap(section => section.fields).find(field => field.key === 'seedbed')!;
  options(field: JoinField): readonly { value: string; label: string }[] {
    return field.key === 'seedbed' ? this.seedbedOptions() : field.options ?? [];
  }
  ngAfterViewInit(): void { this.stepTitle?.nativeElement.focus(); }
  get currentStep() { return this.steps[this.step]; }
  get missing(): number { return this.currentStep.fields.filter(field => !field.optional && !this.form.controls[field.key].value.trim()).length; }
  get selectedSeedbed(): string { return this.seedbedLabel(this.form.controls['seedbed'].value); }
  seedbedLabel(value: string): string { return this.seedbedOptions().find(option => option.value === value)?.label || ''; }
  control(field: JoinField): FormControl<string> { return this.form.controls[field.key]; }
  error(field: JoinField): string {
    const control = this.control(field);
    if (!control.touched || !control.errors) return '';
    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('numeric')) return 'Ingresa solo números';
    if (control.hasError('phone')) return 'Ingresa entre 7 y 10 dígitos';
    if (control.hasError('url')) return 'Ingresa una URL válida';
    if (control.hasError('future')) return 'La fecha no puede ser futura';
    return 'Selecciona una opción válida';
  }
  private focusTitle(): void {
    this.detector.detectChanges();
    this.stepTitle?.nativeElement.focus({ preventScroll: true });
    this.stepTitle?.nativeElement.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  edit(index: number): void { if (!this.loading) { this.step = index; this.focusTitle(); } }
  next(): void {
    if (this.loading) return;
    const fields = this.currentStep.fields;
    fields.forEach(field => this.control(field).markAsTouched());
    const invalid = fields.find(field => this.control(field).invalid);
    if (invalid) { document.getElementById(`request-${invalid.key}`)?.focus(); return; }
    this.step = Math.min(3, this.step + 1);
    this.focusTitle();
  }
  valueLabel(field: JoinField): string {
    const value = this.control(field).value;
    if (field.type === 'select') return this.options(field).find(option => option.value === value)?.label || 'Sin indicar';
    if (field.type === 'date' && value) return value.split('-').reverse().join('/');
    return value || 'Sin indicar';
  }
  invalidSections(): number[] { return [0, 1, 2].filter(index => this.steps[index].fields.some(field => this.control(field).invalid)); }
  async submit(): Promise<void> {
    if (this.loading) return;
    if (this.step !== 3) { this.next(); return; }
    this.form.markAllAsTouched();
    const invalidStep = this.invalidSections()[0];
    if (invalidStep !== undefined) { this.edit(invalidStep); const field = this.currentStep.fields.find(item => this.control(item).invalid); if (field) document.getElementById(`request-${field.key}`)?.focus(); return; }
    this.loading = true;
    this.submitError = '';
    try {
      const payload = Object.fromEntries(Object.entries(this.form.getRawValue()).map(([key, value]) => [key, value.trim()]));
      this.receipt = await this.service.submit(payload);
      this.form.reset();
      this.focusTitle();
    } catch (error: unknown) {
      this.submitError = error instanceof HttpErrorResponse && error.status === 400
        ? 'Revisa los datos: falta información o el semillero ya no está disponible. Tus datos siguen en el formulario.'
        : 'No pudimos radicar la solicitud. Tus datos siguen en el formulario; inténtalo de nuevo.';
    }
    finally { this.loading = false; }
  }
  async copyCode(): Promise<void> {
    if (!this.receipt) return;
    this.copyError = '';
    try { await navigator.clipboard.writeText(`Solicitud: ${this.receipt.id}\nClave de seguimiento: ${this.receipt.trackingToken}`); this.copied = true; }
    catch { this.copyError = 'No se pudo copiar. Selecciona y copia el código manualmente.'; }
  }
}
