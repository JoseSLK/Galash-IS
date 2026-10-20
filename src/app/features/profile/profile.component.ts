import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DashboardComponent, SiteFooterComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly accountStatus = computed(() => {
    const status = this.auth.backendUser()?.status;
    const labels: Record<string, string> = { active: 'Activa', activo: 'Activa', inactive: 'Inactiva', inactivo: 'Inactiva', pending: 'Pendiente', pendiente: 'Pendiente' };
    return status ? labels[status.toLowerCase()] || status : 'No disponible';
  });
  constructor() {
    effect(() => {
      const status = this.auth.sessionStatus();
      if (status === 'anonymous' || status === 'expired') void this.router.navigateByUrl('/');
    });
  }
}
