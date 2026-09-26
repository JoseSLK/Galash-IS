import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  submitted = false;
  loading = false;
  errorMessage = '';

  async submit(): Promise<void> {
    this.submitted = true;
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authService.login(this.loginForm.controls.email.value, this.loginForm.controls.password.value);
      await this.router.navigateByUrl('/');
    } catch {
      this.errorMessage = 'No se pudo iniciar sesión. Verifica tus datos e inténtalo de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authService.loginWithGoogle();
      await this.router.navigateByUrl('/');
    } catch {
      this.errorMessage = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
    } finally {
      this.loading = false;
    }
  }
}
