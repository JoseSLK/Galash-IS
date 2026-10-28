import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export type RequestState = 'Radicada' | 'En revisión' | 'Pendiente de información' | 'Aprobada' | 'Rechazada';

// Only the transitions the contract (M3) allows.
export const NEXT_STATES: Record<RequestState, readonly RequestState[]> = {
  'Radicada': ['En revisión', 'Pendiente de información'],
  'Pendiente de información': ['En revisión'],
  'En revisión': ['Aprobada', 'Rechazada'],
  'Aprobada': [],
  'Rechazada': []
};

export interface RegistrationRequest extends Record<string, unknown> {
  id: string;
  seedbedId?: string;
  nombre: string;
  estado: RequestState;
  observacion?: string;
  fechaRadicacion: string;
  fechaActualizacion: string;
}

export interface ReviewEvent { estado: string; observacion?: string; fecha: string; }
export interface RegistrationDetail extends RegistrationRequest { historial: ReviewEvent[] | null; }

@Injectable({ providedIn: 'root' })
export class RegistrationRequestsService {
  private readonly api = inject(ApiService);
  private readonly state = signal<readonly RegistrationRequest[]>([]);
  readonly requests = this.state.asReadonly();

  async load(): Promise<void> {
    this.state.set((await this.api.get<{ requests: RegistrationRequest[] | null }>('/admin/registration-requests')).requests ?? []);
  }

  detail(id: string): Promise<RegistrationDetail> {
    return this.api.get<RegistrationDetail>(`/admin/registration-requests/${encodeURIComponent(id)}`);
  }

  async changeState(id: string, estado: RequestState, observacion: string): Promise<void> {
    const updated = await this.api.patch<RegistrationRequest, { estado: RequestState; observacion: string }>(
      `/admin/registration-requests/${encodeURIComponent(id)}/status`, { estado, observacion });
    this.state.update(items => items.map(item => item.id === id ? updated : item));
  }
}
