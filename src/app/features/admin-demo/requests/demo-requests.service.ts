import { Injectable, inject, signal } from '@angular/core';
import { AdminDemoAccessService } from '../../../core/services/admin-demo-access.service';

export type RequestState = 'Radicada' | 'En revisión' | 'Pendiente de información' | 'Aprobada' | 'Rechazada';
export interface ReviewEvent { title: string; description: string; date: string; }
export interface DemoRequest {
  id: string;
  name: string;
  seedbed: string;
  state: RequestState;
  submittedAt: string;
  history: readonly ReviewEvent[];
}

function request(id: string, name: string, seedbed: string, state: RequestState, day: number): DemoRequest {
  const date = `2026-10-${String(day).padStart(2, '0')}T12:00:00Z`;
  const history: ReviewEvent[] = [{ title: 'Solicitud recibida', description: 'Recibimos el formulario ficticio del estudiante.', date }];
  if (state === 'Aprobada' || state === 'Rechazada') history.push({ title: `Solicitud ${state.toLowerCase()}`, description: 'Decisión administrativa ficticia para esta demostración.', date });
  return { id, name, seedbed, state, submittedAt: date, history };
}

// Only fictional data; instances belong to the demo page, not to the real API.
@Injectable()
export class DemoRequestsService {
  private readonly access = inject(AdminDemoAccessService);
  private readonly state = signal<readonly DemoRequest[]>([
    request('GAL-DEMO-0041', 'Camilo Ejemplo', 'Ciberseguridad', 'En revisión', 12),
    request('GAL-DEMO-0043', 'Lucía Ejemplo', 'IA', 'En revisión', 14),
    request('GAL-DEMO-0046', 'Andrés Ejemplo', 'RA', 'Pendiente de información', 19),
    request('GAL-DEMO-0048', 'Daniela Ejemplo', 'Ciberseguridad', 'Radicada', 23),
    request('GAL-DEMO-0039', 'Julián Ejemplo', 'IA', 'Rechazada', 8),
    request('GAL-DEMO-0035', 'Sofía Ejemplo', 'RA', 'Aprobada', 1)
  ]);
  readonly requests = this.state.asReadonly();

  decide(id: string, decision: 'Aprobada' | 'Rechazada', observation: string): void {
    if (!this.access.allowed()) throw new Error('Acceso demo no disponible.');
    const item = this.state().find(request => request.id === id);
    const reason = observation.trim();
    if (!item || item.state === 'Aprobada' || item.state === 'Rechazada') throw new Error('La solicitud no espera una decisión.');
    if (!['Aprobada', 'Rechazada'].includes(decision) || reason.length > 1000 || (decision === 'Rechazada' && !reason)) throw new Error('Decisión inválida.');
    const event: ReviewEvent = {
      title: `Solicitud ${decision.toLowerCase()}`,
      description: reason || 'Solicitud aprobada en esta demostración.',
      date: new Date().toISOString()
    };
    this.state.update(requests => requests.map(request => request.id === id
      ? { ...request, state: decision, history: [...request.history, event] } : request));
  }
}
