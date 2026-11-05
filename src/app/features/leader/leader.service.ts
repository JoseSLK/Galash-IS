import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AssignmentSeedbed } from '../admin/seedbed-assignments.service';
import { AssignmentMember } from '../admin/seedbed-assignments.service';

export interface LeaderSeedbed extends AssignmentSeedbed { status: string; visibility: string; }
export interface LeaderActivity { id: string; seedbedId: string; title: string; description: string; status: string; date: string | null; responsibleIds: string[] | null; evidence: string[] | null; }
export interface MemberCandidate { id: string; name: string; last_name: string; role: string; }
@Injectable({ providedIn: 'root' })
export class LeaderService {
  private readonly api = inject(ApiService);
  async owned(): Promise<LeaderSeedbed[]> {
    const user = await this.api.get<{ id: string; managed_seedbed_ids?: string[] }>('/users/me');
    const results = await Promise.all((user.managed_seedbed_ids ?? []).map(id => this.api.get<LeaderSeedbed>(`/seedbeds/${encodeURIComponent(id)}`).catch(() => null)));
    const owned = results.filter((item): item is LeaderSeedbed => !!item && item.responsibleTeacherId === user.id);
    if (!owned.length && results.some(item => !item)) throw new Error('No se pudieron comprobar los semilleros asignados.');
    return owned;
  }
  detail(id: string): Promise<LeaderSeedbed> { return this.api.get(`/seedbeds/${encodeURIComponent(id)}`); }
  async update(id: string, fields: { name: string; description: string; researchLine: string; objective: string; contactEmail: string }): Promise<LeaderSeedbed> {
    const latest = await this.detail(id);
    return this.api.patch(`/seedbeds/${encodeURIComponent(id)}`, { ...fields, responsibleTeacherId: latest.responsibleTeacherId });
  }
  visibility(id: string, status: string): Promise<LeaderSeedbed> { return this.api.patch(`/seedbeds/${encodeURIComponent(id)}/visibility`, { status }); }
  async members(id: string): Promise<AssignmentMember[]> { return (await this.api.get<{ members: AssignmentMember[] | null }>(`/seedbeds/${encodeURIComponent(id)}/members`)).members ?? []; }
  async candidates(query: string): Promise<MemberCandidate[]> {
    if (query.trim().length < 2) return [];
    const members = (await this.api.get<{ members: MemberCandidate[] | null }>(`/members?q=${encodeURIComponent(query.trim())}&limit=50`)).members ?? [];
    return members.filter(member => ['estudiante', 'docente', 'profesor'].includes(member.role.toLowerCase()));
  }
  addMember(id: string, userId: string): Promise<unknown> { return this.api.post(`/seedbeds/${encodeURIComponent(id)}/members`, { userId }); }
  removeMember(id: string, userId: string): Promise<void> { return this.api.delete(`/seedbeds/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`); }
  async delegate(id: string, userId: string, enabled: boolean): Promise<void> {
    const members = await this.members(id);
    if (!members.some(member => member.userId === userId && !member.leftAt)) throw new Error('El usuario ya no es integrante activo.');
    const ids = members.filter(member => member.delegate && !member.leftAt && member.userId !== userId).map(member => member.userId);
    if (enabled) ids.push(userId);
    if (ids.length > 2) throw new Error('El semillero ya tiene dos delegados.');
    await this.api.put(`/seedbeds/${encodeURIComponent(id)}/delegates`, { userIds: ids });
  }
  async activities(id: string): Promise<LeaderActivity[]> { return (await this.api.get<{ activities: LeaderActivity[] | null }>(`/seedbeds/${encodeURIComponent(id)}/activities`)).activities ?? []; }
  activity(id: string): Promise<LeaderActivity> { return this.api.get(`/activities/${encodeURIComponent(id)}`); }
  saveActivity(seedbedId: string, fields: Partial<LeaderActivity>, id?: string): Promise<LeaderActivity> {
    return id ? this.api.patch(`/activities/${encodeURIComponent(id)}`, fields) : this.api.post(`/seedbeds/${encodeURIComponent(seedbedId)}/activities`, fields);
  }
}
