import { Component, computed, inject, input, output, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { USER_ROLES, UserRole } from '../../../core/models/role.model';
import { ACCOUNT_STATUS_LABELS, DirectoryPerson } from './person-directory.model';

type DirectoryFilter = 'all' | UserRole | 'inactive';
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-people-directory', standalone: true,
  templateUrl: './people-directory.component.html',
  styleUrl: './people-directory.component.css'
})
export class PeopleDirectoryComponent {
  private readonly auth = inject(AuthService);
  readonly people = input.required<readonly DirectoryPerson[]>();
  readonly selectedId = input<string | null>(null);
  readonly management = input(false);
  readonly selection = output<string>();
  // Lets a parent run a server-side search with the same box.
  readonly queryChange = output<string>();
  readonly query = signal('');
  readonly filter = signal<DirectoryFilter>('all');
  readonly seedbed = signal('');
  readonly page = signal(1);
  readonly pageSize = 6;
  readonly roles = USER_ROLES;
  readonly statusLabels = ACCOUNT_STATUS_LABELS;
  readonly privateView = computed(() => this.management() && this.auth.isAdmin());
  readonly visiblePeople = computed(() => this.people().filter(person => this.privateView() || person.status === 'active'));
  readonly seedbeds = computed(() => [...new Set(this.visiblePeople().map(person => person.seedbed))].filter(Boolean).sort());
  readonly filtered = computed(() => {
    const query = normalize(this.query());
    const filter = this.filter();
    return this.visiblePeople().filter(person => {
      const matchesText = normalize(person.name).includes(query)
        || (this.privateView() && normalize(person.email || '').includes(query));
      const matchesFilter = filter === 'all' || (filter === 'inactive'
        ? this.privateView() && person.status === filter : person.role === filter);
      return matchesText && matchesFilter && (!this.seedbed() || person.seedbed === this.seedbed());
    }).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly currentPage = computed(() => Math.min(this.page(), this.pageCount()));
  readonly pagePeople = computed(() => this.filtered().slice((this.currentPage() - 1) * this.pageSize, this.currentPage() * this.pageSize));
  readonly filters = computed<readonly { id: DirectoryFilter; label: string }[]>(() => [
    { id: 'all', label: 'Todos' }, ...USER_ROLES.map(role => ({ id: role.id, label: role.label })),
    ...(this.privateView() ? [{ id: 'inactive' as const, label: 'Inactivas' }] : [])
  ]);

  search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.queryChange.emit(this.query());
  }
  chooseFilter(value: DirectoryFilter): void { this.filter.set(value); this.page.set(1); }
  chooseSeedbed(event: Event): void { this.seedbed.set((event.target as HTMLSelectElement).value); this.page.set(1); }
  clear(): void { this.query.set(''); this.filter.set('all'); this.seedbed.set(''); this.page.set(1); }
  roleLabel(role: UserRole): string { return USER_ROLES.find(item => item.id === role)?.label || ''; }
  initials(name: string): string { return name.split(/\s+/).slice(0, 2).map(word => word[0]).join(''); }
}
