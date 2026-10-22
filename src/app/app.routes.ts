import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: DashboardComponent },
  { path: 'semilleros', loadComponent: () => import('./features/seedbeds/seedbeds.component').then(module => module.SeedbedsComponent) },
  { path: 'unete', loadComponent: () => import('./features/join-request/join-request.component').then(module => module.JoinRequestComponent) },
  { path: '**', redirectTo: '' }
];
