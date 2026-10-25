import { Injectable, inject, signal } from '@angular/core';
import { AdminDemoAccessService } from '../../core/services/admin-demo-access.service';
import { USER_ROLES, UserRole } from '../../core/models/role.model';
import { AccountStatus, DirectoryPerson } from '../../shared/components/people-directory/person-directory.model';

const DEMO_PEOPLE: readonly DirectoryPerson[] = [
  { id: 'demo-01', name: 'Camila Ejemplo', email: 'camila@example.test', role: 'estudiante', status: 'active', seedbed: 'Ciberseguridad', joinedAt: '2026-09-12' },
  { id: 'demo-02', name: 'Daniel Ejemplo', email: 'daniel@example.test', role: 'docente', status: 'active', seedbed: 'RA', joinedAt: '2026-09-10' },
  { id: 'demo-04', name: 'Sofía Ejemplo', email: 'sofia@example.test', role: 'docente', status: 'active', seedbed: 'IA', joinedAt: '2026-08-04' },
  { id: 'demo-05', name: 'Julián Ejemplo', email: 'julian@example.test', role: 'estudiante', status: 'inactive', seedbed: 'Ciberseguridad', joinedAt: '2026-08-15' },
  { id: 'demo-06', name: 'Valeria Ejemplo', email: 'valeria@example.test', role: 'estudiante', status: 'active', seedbed: 'IA', joinedAt: '2026-09-01' },
  { id: 'demo-08', name: 'Paula Ejemplo', email: 'paula@example.test', role: 'admin', status: 'active', seedbed: '', joinedAt: '2026-07-01' }
];

// Provided by the demo page: changes disappear when it is closed or reloaded.
@Injectable()
export class DemoUsersService {
  private readonly access = inject(AdminDemoAccessService);
  private readonly state = signal<readonly DirectoryPerson[]>(DEMO_PEOPLE.map(person => ({ ...person })));
  readonly people = this.state.asReadonly();

  update(id: string, role: UserRole, status: AccountStatus): void {
    if (!this.access.allowed()) throw new Error('Acceso demo no disponible.');
    if (!USER_ROLES.some(item => item.id === role) || !['active', 'inactive'].includes(status)) throw new Error('Datos demo inválidos.');
    if (!this.state().some(person => person.id === id)) throw new Error('Persona demo no encontrada.');
    this.state.update(people => people.map(person => person.id === id ? { ...person, role, status } : person));
  }
}
