import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { profileGuard } from './core/guards/profile.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: DashboardComponent },
  { path: 'nosotros', loadComponent: () => import('./features/nosotros/nosotros-page.component').then(module => module.NosotrosPageComponent) },
  { path: 'semilleros', loadComponent: () => import('./features/seedbeds/seedbeds.component').then(module => module.SeedbedsComponent) },
  { path: 'proyectos', loadComponent: () => import('./features/projects/projects-page.component').then(module => module.ProjectsPageComponent) },
  { path: 'eventos', loadComponent: () => import('./features/events/events.component').then(module => module.EventsComponent) },
  { path: 'unete', loadComponent: () => import('./features/join-request/join-request.component').then(module => module.JoinRequestComponent) },
  { path: 'mi-solicitud', loadComponent: () => import('./features/request-status/request-status.component').then(module => module.RequestStatusComponent) },
  { path: 'mi-perfil', canActivate: [profileGuard], loadComponent: () => import('./features/profile/profile.component').then(module => module.ProfileComponent) },
  { path: 'gestion-semillero', canActivate: [profileGuard], data: { leaderMode: true }, loadComponent: () => import('./features/admin/admin.component').then(module => module.AdminComponent) },
  { path: 'administracion', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin.component').then(module => module.AdminComponent) },
  { path: '**', redirectTo: '' }
];
