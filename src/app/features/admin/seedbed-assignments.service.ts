import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface AssignmentSeedbed {
  id: string;
  name: string;
  description: string;
  researchLine: string;
  objective: string;
  contactEmail: string;
  responsibleTeacherId: string;
}
export interface SeedbedTopic { title: string; phrase: string; }
export interface NewSeedbed {
  name: string;
  description: string;
  researchLine: string;
  objective: string;
  responsibleTeacherId: string;
  contactEmail: string;
  topics?: SeedbedTopic[];
}
export interface TeacherOption { id: string; name: string; }
export interface AssignmentMember {
  userId: string;
  name: string;
  lastName: string;
  delegate: boolean;
  leftAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SeedbedAssignmentsService {
  private readonly api = inject(ApiService);

  async list(): Promise<AssignmentSeedbed[]> {
    const all: AssignmentSeedbed[] = [];
    for (let page = 1; ; page++) {
      const response = await this.api.get<{ seedbeds: AssignmentSeedbed[] | null }>(
        `/seedbeds?includeInactive=true&page=${page}&pageSize=100`);
      const items = response.seedbeds ?? [];
      all.push(...items);
      if (items.length < 100) return all;
    }
  }
  // POST /seedbeds (M2): created as Borrador; backend validates unique name and active Docente.
  create(seedbed: NewSeedbed): Promise<AssignmentSeedbed & { status: string }> {
    return this.api.post('/seedbeds', seedbed);
  }
  async teachers(): Promise<TeacherOption[]> {
    const { users } = await this.api.get<{ users: { id: string; name: string; last_name: string; role: string; status: string }[] | null }>('/admin/members');
    return (users ?? [])
      .filter(user => user.status === 'activo' && ['docente', 'profesor'].includes(user.role.toLowerCase()))
      .map(user => ({ id: user.id, name: [user.name, user.last_name].filter(Boolean).join(' ') }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
  detail(id: string): Promise<AssignmentSeedbed> {
    return this.api.get(`/seedbeds/${encodeURIComponent(id)}`);
  }
  async members(id: string): Promise<AssignmentMember[]> {
    const response = await this.api.get<{ members: AssignmentMember[] | null }>(`/seedbeds/${encodeURIComponent(id)}/members`);
    return (response.members ?? []).filter(member => !member.leftAt);
  }
  async assignLeader(id: string, userId: string): Promise<void> {
    // PATCH expects the editable fields too. Read the latest values and omit topics to preserve them.
    const seedbed = await this.detail(id);
    const { name, description, researchLine, objective, contactEmail } = seedbed;
    await this.api.patch(`/seedbeds/${encodeURIComponent(id)}`, {
      name, description, researchLine, objective, contactEmail, responsibleTeacherId: userId
    });
  }
  async assignDelegate(id: string, userId: string): Promise<void> {
    const members = await this.members(id);
    if (!members.some(member => member.userId === userId)) throw new Error('La cuenta debe ser integrante activo de este semillero.');
    const userIds = [...new Set([...members.filter(member => member.delegate).map(member => member.userId), userId])];
    if (userIds.length > 2) throw new Error('Este semillero ya tiene dos delegados.');
    await this.api.put(`/seedbeds/${encodeURIComponent(id)}/delegates`, { userIds });
  }
}
