import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-complete-registration',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './complete-registration.component.html',
  styleUrl: './complete-registration.component.css'
})
export class CompleteRegistrationComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly registrationForm = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/)]],
    apellido: ['', [Validators.required, Validators.pattern(/\S/)]],
    tipo_dni: ['', [Validators.required]],
    dni: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    estado: ['activo', [Validators.required]]
  });

  submitted = false;
  loading = false;
  errorMessage = '';

  constructor() {
    const email = this.authService.currentUser()?.email;
    if (email) {
      this.registrationForm.controls.email.setValue(email);
      this.registrationForm.controls.email.disable();
    }
  }

  async submit(): Promise<void> {
    this.submitted = true;
    if (this.registrationForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authService.completeRegistration(this.registrationForm.getRawValue());
      await this.router.navigateByUrl('/');
    } catch {
      this.errorMessage = 'No se pudo completar el registro. Verifica los datos e inténtalo de nuevo.';
    } finally {
      this.loading = false;
    }
  }
}
