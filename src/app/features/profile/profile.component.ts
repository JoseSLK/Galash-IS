import {ProfilePhotoEditorComponent} from './profile-photo-editor.component';
import {ProjectsPageComponent} from '../projects/projects-page.component';
import {ComunicadosAdminComponent} from '../admin/comunicados/comunicados-admin.component';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { ProfileAssignment, ProfileAssignmentsService } from './profile-assignments.service';
import { MemberProfile, ProfileDataService } from './profile-data.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ComunicadosAdminComponent,ProfilePhotoEditorComponent,ProjectsPageComponent,DashboardComponent, SiteFooterComponent, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly assignmentService = inject(ProfileAssignmentsService);
  private readonly profileData = inject(ProfileDataService);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly assignments = signal<ProfileAssignment[]>([]);
  readonly assignmentsLoading = signal(false);
  readonly assignmentsError = signal('');
  private assignmentRequest = 0;
  readonly memberProfile = signal<MemberProfile | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly profileForm = this.fb.group({
    phone: [''],
    birth_date: [''],
    area: [''],
    formation: [''],
    orcid: [''],
    cvlac: [''],
    google_scholar: [''],
    visible_publicly: [true]
  });
  readonly accountStatus = computed(() => {
    const status = this.auth.backendUser()?.status;
    const labels: Record<string, string> = { active: 'Activa', activo: 'Activa', inactive: 'Inactiva', inactivo: 'Inactiva', pending: 'Pendiente', pendiente: 'Pendiente' };
    return status ? labels[status.toLowerCase()] || status : 'No disponible';
  });
  constructor() {
    effect(() => {
      const id = this.auth.backendUser()?.id;
      if (id && this.auth.isAuthenticated()) {
        void this.refreshAssignments();
        void this.loadMemberProfile(id);
      }
      else {
        this.assignmentRequest++;
        this.assignments.set([]);
        this.assignmentsLoading.set(false);
        this.assignmentsError.set('');
        this.memberProfile.set(null);
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

  private async loadMemberProfile(id: string): Promise<void> {
    try {
      this.memberProfile.set(await this.profileData.ownMemberProfile(id));
    } catch {
      this.memberProfile.set(null);
    }
  }

  startEdit(): void {
    const member = this.memberProfile();
    const user = this.auth.backendUser();
    this.profileForm.setValue({
      phone: user?.phone ?? '',
      birth_date: user?.birth_date ?? '',
      area: member?.area ?? '',
      formation: member?.formation ?? '',
      orcid: member?.orcid ?? '',
      cvlac: member?.cvlac ?? '',
      google_scholar: member?.google_scholar ?? '',
      visible_publicly: member?.visible_publicly ?? true
    });
    this.saveError.set('');
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.saveError.set('');
  }

  async saveProfile(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');
    try {
      const updated = await this.profileData.updateOwnProfile(this.profileForm.getRawValue());
      this.memberProfile.set(updated);
      await this.auth.refreshBackendSession();
      this.editing.set(false);
    } catch {
      this.saveError.set('No se pudo guardar la información. Revisa los datos e inténtalo de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }
}
