import { Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DashboardComponent, SiteFooterComponent, PeopleDirectoryComponent, ReactiveFormsModule, RegistrationRequestsComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnDestroy {
  @ViewChild('sectionMenu') private sectionMenu?: ElementRef<HTMLDetailsElement>;
  readonly upcomingSections = ['Semilleros', 'Proyectos', 'Noticias y eventos', 'Auditoría'];
  readonly activeSection = signal<'users' | 'requests'>('users');
  readonly auth = inject(AuthService);
  readonly users = inject(MembersAdminService);
  readonly roles = USER_ROLES;
  readonly searching = signal(false);
  readonly searchMessage = signal('Escribe al menos 2 letras del nombre o correo para buscar cuentas.');
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
    });
    effect(() => {
      const person = this.selected();
      if (person) this.form.reset({ role: person.role, status: person.status });
    });
  }

  closeSections(menu: HTMLDetailsElement): void {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }

  showSection(section: 'users' | 'requests', menu: HTMLDetailsElement): void {
    this.activeSection.set(section);
    this.closeSections(menu);
  }

  @HostListener('document:click', ['$event'])
  dismissSections(event: MouseEvent): void {
    const menu = this.sectionMenu?.nativeElement;
    if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
  }

  // GET /admin/members needs a query, so the directory box searches the server after a pause.
  queueSearch(query: string): void {
    clearTimeout(this.searchTimer);
    if (query.trim().length < 2) {
      this.searchId++;
      this.searching.set(false);
      return;
    }
    this.searchTimer = setTimeout(() => void this.search(query), 300);
  }

  private async search(query: string): Promise<void> {
    const id = ++this.searchId;
    this.searching.set(true);
    try {
      await this.users.search(query);
      if (id !== this.searchId) return;
      this.selectedId.set(this.users.people()[0]?.id || null);
      this.searchMessage.set(this.users.people().length ? '' : 'No hay cuentas que coincidan con la búsqueda.');
    } catch {
      if (id === this.searchId) this.searchMessage.set('No se pudo buscar. Inténtalo de nuevo.');
    } finally {
      if (id === this.searchId) this.searching.set(false);
    }
  }

  select(id: string): void {
    this.selectedId.set(id);
    this.feedback.set('');
    this.error.set('');
  }

  ngOnDestroy(): void { clearTimeout(this.searchTimer); }

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
