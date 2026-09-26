import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { CompleteRegistrationComponent } from './features/auth/complete-registration/complete-registration.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: DashboardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro/completar', component: CompleteRegistrationComponent },
  { path: 'registro', component: RegisterComponent },
  { path: '**', redirectTo: 'login' }
];
