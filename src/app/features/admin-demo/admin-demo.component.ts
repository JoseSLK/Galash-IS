import { Component, ElementRef, HostListener, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { AdminDemoAccessService } from '../../core/services/admin-demo-access.service';
import { PeopleDirectoryComponent } from '../../shared/components/people-directory/people-directory.component';
import { DemoUsersService } from './demo-users.service';
import { USER_ROLES, UserRole } from '../../core/models/role.model';
import { AccountStatus } from '../../shared/components/people-directory/person-directory.model';
import { DemoRequestsComponent } from './requests/demo-requests.component';
import { DemoRequestsService } from './requests/demo-requests.service';

@Component({
  selector: 'app-admin-demo',
  standalone: true,
  imports: [DashboardComponent, SiteFooterComponent, PeopleDirectoryComponent, ReactiveFormsModule, DatePipe, DemoRequestsComponent],
  providers: [DemoUsersService, DemoRequestsService],
  templateUrl: './admin-demo.component.html',
  styleUrl: './admin-demo.component.css'
})
export class AdminDemoComponent {
  @ViewChild('sectionMenu') private sectionMenu?: ElementRef<HTMLDetailsElement>;
  readonly upcomingSections = ['Semilleros', 'Proyectos', 'Noticias y eventos', 'Auditoría'];
  readonly activeSection = signal<'users' | 'requests'>('users');
  readonly access = inject(AdminDemoAccessService);
  readonly users = inject(DemoUsersService);
  readonly roles = USER_ROLES;
  readonly selectedId = signal<string | null>(this.users.people()[0]?.id || null);
  readonly selected = computed(() => this.users.people().find(person => person.id === this.selectedId()) || null);
  readonly feedback = signal('');
  readonly error = signal('');
  readonly form = new FormGroup({
    role: new FormControl<UserRole>('visitante', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<AccountStatus>('active', { nonNullable: true, validators: [Validators.required] })
  });
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (!this.access.allowed()) void this.router.navigateByUrl('/');
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

  select(id: string): void {
    this.selectedId.set(id);
    this.feedback.set('');
    this.error.set('');
  }

  toggleStatus(): void {
    if (!this.access.allowed()) return;
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

  save(): void {
    const person = this.selected();
    if (!person || !this.access.allowed() || this.form.invalid || this.form.pristine) return;
    this.error.set('');
    try {
      const { role, status } = this.form.getRawValue();
      this.users.update(person.id, role, status);
      this.form.markAsPristine();
      this.feedback.set(`Cambios simulados guardados para ${person.name}.`);
    } catch {
      this.error.set('No se pudieron guardar los cambios demo. Revisa el acceso e inténtalo de nuevo.');
    }
  }
}
