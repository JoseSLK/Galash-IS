import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { profileGuard } from './core/guards/profile.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: DashboardComponent },
  { path: 'semilleros', loadComponent: () => import('./features/seedbeds/seedbeds.component').then(module => module.SeedbedsComponent) },
  { path: 'unete', loadComponent: () => import('./features/join-request/join-request.component').then(module => module.JoinRequestComponent) },
  { path: 'mi-solicitud', loadComponent: () => import('./features/request-status/request-status.component').then(module => module.RequestStatusComponent) },
  { path: 'mi-perfil', canActivate: [profileGuard], loadComponent: () => import('./features/profile/profile.component').then(module => module.ProfileComponent) },
  { path: 'administracion', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin.component').then(module => module.AdminComponent) },
  { path: '**', redirectTo: '' }
];
