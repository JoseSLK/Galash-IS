import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly registerForm = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/)]],
    apellido: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  submitted = false;
  loading = false;
  errorMessage = '';

  async submit(): Promise<void> {
    const traceId = createTraceId();
    console.info(`[RegisterComponent][registro:${traceId}] Submit recibido.`);
    this.submitted = true;
    if (this.registerForm.invalid) {
      console.warn(`[RegisterComponent][registro:${traceId}] Formulario inválido.`, {
        nombre: this.registerForm.controls.nombre.errors,
        apellido: this.registerForm.controls.apellido.errors,
        email: this.registerForm.controls.email.errors,
        password: this.registerForm.controls.password.errors
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const value = this.registerForm.getRawValue();
    console.info(`[RegisterComponent][registro:${traceId}] Formulario válido.`, {
      email: value.email.trim(),
      hasPassword: Boolean(value.password)
    });
    try {
      await this.authService.register(value.nombre, value.apellido, value.email, value.password, traceId);
      console.info(`[RegisterComponent][registro:${traceId}] Registro completo. Navegando al dashboard.`);
      await this.router.navigateByUrl('/');
    } catch (error: unknown) {
      console.error(`[RegisterComponent][registro:${traceId}] Registro fallido.`, error);
      this.errorMessage = 'No se pudo completar el registro. Verifica los datos e inténtalo de nuevo.';
    } finally {
      this.loading = false;
      console.info(`[RegisterComponent][registro:${traceId}] Flujo finalizado.`, { loading: this.loading });
    }
  }
}

function createTraceId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `registro-${Date.now()}`;
}
