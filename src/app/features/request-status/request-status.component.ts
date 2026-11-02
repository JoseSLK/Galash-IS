import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';

const STATES = ['Radicada', 'En revisión', 'Pendiente de información', 'Aprobada', 'Rechazada'] as const;
interface RequestStatus {
  estado: typeof STATES[number];
  fechaActualizacion?: string;
  observacion?: string;
}

@Component({
  selector: 'app-request-status',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, DashboardComponent, SiteFooterComponent],
  templateUrl: './request-status.component.html',
  styleUrl: './request-status.component.css'
})
export class RequestStatusComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly code = new FormControl(this.route.snapshot.queryParamMap.get('id') || '', {
    nonNullable: true, validators: [Validators.required, Validators.maxLength(120), Validators.pattern(/^[a-zA-Z0-9-]+$/)]
  });
  readonly result = signal<RequestStatus | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submittedCode = signal('');
  readonly states = STATES;
  readonly authenticated = computed(() => this.auth.isAuthenticated() && this.auth.sessionStatus() === 'authenticated');
  readonly description = computed(() => {
    switch (this.result()?.estado) {
      case 'Radicada': return 'Recibimos tu solicitud';
      case 'En revisión': return 'Tu solicitud está siendo revisada';
      case 'Pendiente de información': return 'Se necesita información adicional';
      case 'Aprobada': return 'Tu solicitud fue aprobada';
      case 'Rechazada': return 'Tu solicitud fue rechazada';
      default: return '';
    }
  });
  readonly progress = computed(() => {
    switch (this.result()?.estado) {
      case 'Aprobada': case 'Rechazada': return 100;
      case 'En revisión': case 'Pendiente de información': return 60;
      default: return 20;
    }
  });

  constructor() {
    let previousAccount: string | undefined;
    effect(() => {
      const account = this.authenticated() ? this.auth.backendUser()?.id : undefined;
      if (previousAccount !== account) {
        this.result.set(null);
        this.submittedCode.set('');
        this.error.set('');
      }
      previousAccount = account;
    });
  }

  async consult(event: Event): Promise<void> {
    event.preventDefault();
    if (this.loading() || !this.authenticated()) return;
    this.code.markAsTouched();
    if (this.code.invalid) return;
    const account = this.auth.backendUser()?.id;
    const code = this.code.value.trim();
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
    try {
      const response = await this.api.get<RequestStatus>(`/registration-requests/${encodeURIComponent(code)}/status`);
      if (!this.authenticated() || this.auth.backendUser()?.id !== account) return;
      if (!response || !STATES.includes(response.estado)) throw new Error('Unexpected status response');
      this.submittedCode.set(code);
      this.result.set(response);
    } catch (error: unknown) {
      this.error.set(error instanceof HttpErrorResponse && [400, 401, 403, 404].includes(error.status)
        ? 'No pudimos consultar esta solicitud. Verifica el código y que hayas iniciado sesión con la cuenta del solicitante.'
        : 'No pudimos consultar el estado en este momento. Inténtalo de nuevo.');
    } finally { this.loading.set(false); }
  }
}
