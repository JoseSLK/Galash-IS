import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { parseUserRole, UserRole } from '../../core/models/role.model';
import { AccountStatus, DirectoryPerson } from '../../shared/components/people-directory/person-directory.model';

interface AdminProfile {
  id: string;
  firebase_uid: string;
  name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class MembersAdminService {
  private readonly api = inject(ApiService);
  private readonly state = signal<readonly DirectoryPerson[]>([]);
  // PUT /users/{userId}/roles takes the Firebase UID, not the member id.
  private firebaseUids = new Map<string, string>();
  readonly people = this.state.asReadonly();

  // GET /admin/members requires a name or email query.
  async search(query: string): Promise<void> {
    const { users: members } = await this.api.get<{ users: AdminProfile[] | null }>(`/admin/members?q=${encodeURIComponent(query.trim())}&limit=50`);
    this.firebaseUids = new Map((members ?? []).map(member => [member.id, member.firebase_uid]));
    this.state.set((members ?? []).map(member => ({
      id: member.id,
      name: [member.name, member.last_name].filter(Boolean).join(' '),
      email: member.email,
      role: parseUserRole(member.role) ?? 'visitante',
      status: member.status === 'activo' ? 'active' : 'inactive',
      seedbed: '',
      joinedAt: ''
    })));
  }

  async update(id: string, role: UserRole, status: AccountStatus): Promise<void> {
    const person = this.state().find(item => item.id === id);
    const uid = this.firebaseUids.get(id);
    if (!person || !uid) throw new Error('Cuenta no encontrada.');
    // Each change is saved on its own, so a failure in the second keeps the first visible.
    if (person.role !== role) {
      await this.api.put<void, { role: UserRole }>(`/users/${encodeURIComponent(uid)}/roles`, { role });
      this.patchLocal(id, { role });
    }
    if (person.status !== status) {
      await this.api.patch<unknown, { status: string }>(`/members/${encodeURIComponent(id)}/status`, { status: status === 'active' ? 'activo' : 'inactivo' });
      this.patchLocal(id, { status });
    }
  }

  private patchLocal(id: string, change: Partial<DirectoryPerson>): void {
    this.state.update(people => people.map(item => item.id === id ? { ...item, ...change } : item));
  }
}
