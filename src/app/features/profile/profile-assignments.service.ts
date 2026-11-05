import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface ProfileAssignment {
  id: string;
  name: string;
  function: 'Líder de semillero' | 'Delegado' | 'Función de gestión';
  unavailable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfileAssignmentsService {
  private readonly api = inject(ApiService);

  async load(): Promise<ProfileAssignment[]> {
    // Read fresh assignments: an administrator may have changed them since login.
    const user = await this.api.get<{ id: string; managed_seedbed_ids?: string[] }>('/users/me');
    const ids = [...new Set(user.managed_seedbed_ids ?? [])];
    return Promise.all(ids.map(async id => {
      try {
        const seedbed = await this.api.get<{ name: string; responsibleTeacherId: string }>(`/seedbeds/${encodeURIComponent(id)}`);
        return { id, name: seedbed.name, function: seedbed.responsibleTeacherId === user.id ? 'Líder de semillero' : 'Delegado' } as ProfileAssignment;
      } catch {
        // Hidden semilleros may not expose their detail to delegates. Do not invent a role.
        return { id, name: 'Semillero no disponible', function: 'Función de gestión', unavailable: true } as ProfileAssignment;
      }
    }));
  }
}
