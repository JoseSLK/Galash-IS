import { ComunicadosAdminComponent } from './comunicados/comunicados-admin.component';
import { ProjectsPageComponent } from '../projects/projects-page.component';
import { IntegrantesAdminComponent } from './integrantes/integrantes-admin.component';
import { ReviewsAdminComponent } from './reviews/reviews-admin.component';
import { SeedbedReviewsService } from '../seedbeds/reviews/seedbed-reviews.service';
import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { PeopleDirectoryComponent } from '../../shared/components/people-directory/people-directory.component';
import { MembersAdminService } from './members-admin.service';
import { USER_ROLES, UserRole } from '../../core/models/role.model';
import { AccountStatus } from '../../shared/components/people-directory/person-directory.model';
import { RegistrationRequestsComponent } from './requests/registration-requests.component';
import { EventsAdminComponent } from './events/events-admin.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ComunicadosAdminComponent, ProjectsPageComponent, IntegrantesAdminComponent, ReviewsAdminComponent, DashboardComponent, SiteFooterComponent, PeopleDirectoryComponent, ReactiveFormsModule, RegistrationRequestsComponent, EventsAdminComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnDestroy {
  readonly menuOpen = signal(true);
  readonly activeSection = signal<'users' | 'requests' | 'events' | 'reviews' | 'members' | 'projects' | 'communications'>('users');
  readonly auth = inject(AuthService);
  readonly reviews = inject(SeedbedReviewsService);
  readonly users = inject(MembersAdminService);
  readonly roles = USER_ROLES;
  readonly searching = signal(false);
  readonly searchMessage = signal('');
  private initialLoadStarted = false;
  private searchTimer?: ReturnType<typeof setTimeout>;
  private searchId = 0;
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.users.people().find(person => person.id === this.selectedId()) || null);
  readonly saving = signal(false);
  readonly feedback = signal('');
  readonly error = signal('');
  readonly form = new FormGroup({
    role: new FormControl<UserRole>('visitante', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<AccountStatus>('active', { nonNullable: true, validators: [Validators.required] })
  });
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (this.auth.sessionStatus() !== 'checking' && !this.auth.isAdmin()) void this.router.navigateByUrl('/');
      if (this.auth.isAdmin() && !this.initialLoadStarted) {
        this.initialLoadStarted = true;
        this.users.clear();
        void this.search('');
      }
    });
    effect(() => {
      const person = this.selected();
      if (person) this.form.reset({ role: person.role, status: person.status });
    });
  }

  showSection(section: 'users' | 'requests' | 'events' | 'reviews' | 'members' | 'projects' | 'communications'): void {
    this.activeSection.set(section);
  }

  queueSearch(query: string): void {
    clearTimeout(this.searchTimer);
    this.searchId++;
    this.users.clear();
    this.selectedId.set(null);
    if (!query.trim()) { void this.search(''); return; }
    this.searching.set(true);
    this.searchTimer = setTimeout(() => void this.search(query), 300);
  }

  private async search(query: string): Promise<void> {
    const id = ++this.searchId;
    this.searching.set(true);
    try {
      await this.users.search(query);
      if (id !== this.searchId) return;
      const people = [...this.users.people()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
      this.selectedId.set(people[0]?.id || null);
      this.searchMessage.set(this.users.people().length ? '' : query.trim() ? 'No hay cuentas que coincidan con la búsqueda.' : 'No hay cuentas registradas.');
    } catch (error: unknown) {
      if (id === this.searchId) {
        this.users.clear();
        this.selectedId.set(null);
        this.searchMessage.set(error instanceof HttpErrorResponse && error.status === 400 && !query.trim()
          ? 'El servidor aún no permite listar las cuentas sin una búsqueda. La carga inicial requiere actualizar el backend.'
          : 'No se pudieron cargar las cuentas. Inténtalo de nuevo.');
      }
    } finally {
      if (id === this.searchId) this.searching.set(false);
    }
  }

  select(id: string): void {
    this.selectedId.set(id);
    this.feedback.set('');
    this.error.set('');
  }

  ngOnDestroy(): void { clearTimeout(this.searchTimer); this.searchId++; this.users.clear(); }

  initials(name: string): string { return name.split(/\s+/).slice(0, 2).map(word => word[0]).join(''); }

  toggleStatus(): void {
    this.form.controls.status.setValue(this.form.controls.status.value === 'active' ? 'inactive' : 'active');
    this.form.controls.status.markAsDirty();
    this.feedback.set('');
  }

  cancel(): void {
    const person = this.selected();
    if (person) this.form.reset({ role: person.role, status: person.status });
    this.feedback.set('');
    this.error.set('');
  }

  async save(): Promise<void> {
    const person = this.selected();
    if (!person || this.saving() || this.form.invalid || this.form.pristine) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const { role, status } = this.form.getRawValue();
      await this.users.update(person.id, role, status);
      this.form.markAsPristine();
      this.feedback.set(`Cambios guardados para ${person.name}.`);
    } catch (error: unknown) {
      this.error.set(error instanceof HttpErrorResponse && error.status === 409
        ? 'No puedes cambiar tu propio rol.'
        : 'No se pudieron guardar todos los cambios. Revisa la cuenta e inténtalo de nuevo.');
      // Show what was really saved before the failure.
      const current = this.selected();
      if (current) this.form.reset({ role: current.role, status: current.status });
    } finally {
      this.saving.set(false);
    }
  }
}
