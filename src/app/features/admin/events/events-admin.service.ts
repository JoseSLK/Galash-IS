import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export type EventStatus = 'borrador' | 'publicado' | 'oculto' | 'cancelado';
export interface EventData {
  title: string;
  description: string;
  type: string;
  startAt: string;
  endAt: string | null;
  venue: string;
  meetingUrl: string;
  imageUrl: string;
  registrationUrl: string;
}
export interface ManagedEvent extends EventData {
  id: string;
  status: EventStatus;
  organizerName?: string;
  updatedAt?: string;
}
@Injectable({ providedIn: 'root' })
export class EventsAdminService {
  private readonly api = inject(ApiService);
  async list(): Promise<ManagedEvent[]> {
    return (await this.api.get<{ events: ManagedEvent[] | null }>('/events')).events ?? [];
  }
  detail(id: string): Promise<ManagedEvent> { return this.api.get(`/events/${encodeURIComponent(id)}`); }
  create(data: EventData): Promise<ManagedEvent> { return this.api.post('/events', data); }
  update(id: string, data: EventData): Promise<ManagedEvent> { return this.api.patch(`/events/${encodeURIComponent(id)}`, data); }
  action(id: string, action: 'publish' | 'hide' | 'cancel'): Promise<ManagedEvent> {
    return this.api.post(`/events/${encodeURIComponent(id)}/${action}`, {});
  }
}
