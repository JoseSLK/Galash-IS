import {ProjectsPageComponent} from '../projects/projects-page.component';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { ProfileAssignment, ProfileAssignmentsService } from './profile-assignments.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ProjectsPageComponent,DashboardComponent, SiteFooterComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly assignmentService = inject(ProfileAssignmentsService);
  readonly assignments = signal<ProfileAssignment[]>([]);
  readonly assignmentsLoading = signal(false);
  readonly assignmentsError = signal('');
  private assignmentRequest = 0;
  readonly accountStatus = computed(() => {
    const status = this.auth.backendUser()?.status;
    const labels: Record<string, string> = { active: 'Activa', activo: 'Activa', inactive: 'Inactiva', inactivo: 'Inactiva', pending: 'Pendiente', pendiente: 'Pendiente' };
    return status ? labels[status.toLowerCase()] || status : 'No disponible';
  });
  constructor() {
    effect(() => {
      const id = this.auth.backendUser()?.id;
      if (id && this.auth.isAuthenticated()) void this.refreshAssignments();
      else {
        this.assignmentRequest++;
        this.assignments.set([]);
        this.assignmentsLoading.set(false);
        this.assignmentsError.set('');
      }
    });
    effect(() => {
      const status = this.auth.sessionStatus();
      if (status === 'anonymous' || status === 'expired') void this.router.navigateByUrl('/');
    });
  }
  async refreshAssignments(): Promise<void> {
    const request = ++this.assignmentRequest;
    this.assignmentsLoading.set(true);
    this.assignmentsError.set('');
    this.assignments.set([]);
    try {
      const assignments = await this.assignmentService.load();
      if (request === this.assignmentRequest) this.assignments.set(assignments);
    } catch {
      if (request === this.assignmentRequest) this.assignmentsError.set('No pudimos consultar tus funciones en semilleros. Recarga la página para volver a intentarlo.');
    } finally {
      if (request === this.assignmentRequest) this.assignmentsLoading.set(false);
    }
  }
}
