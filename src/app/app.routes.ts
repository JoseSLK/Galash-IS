import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { profileGuard } from './core/guards/profile.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: DashboardComponent },
  { path: 'semilleros', loadComponent: () => import('./features/seedbeds/seedbeds.component').then(module => module.SeedbedsComponent) },
  { path: 'mi-perfil', canActivate: [profileGuard], loadComponent: () => import('./features/profile/profile.component').then(module => module.ProfileComponent) },
  { path: '**', redirectTo: '' }
];
