import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: DashboardComponent },
  { path: 'semilleros', loadComponent: () => import('./features/seedbeds/seedbeds.component').then(module => module.SeedbedsComponent) },
  { path: '**', redirectTo: '' }
];
