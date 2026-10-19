import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Output, ViewChild, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AuthService,
  RegistrationSaveError,
  RegistrationSessionError
} from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements AfterViewInit {
  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;
  @ViewChild('firstName') private firstName?: ElementRef<HTMLInputElement>;
  @Output() readonly completed = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  readonly email = this.authService.currentUser()?.email ?? '';
  private readonly googleNameParts = (this.authService.currentUser()?.displayName ?? '').trim().split(/\s+/).filter(Boolean);
  readonly registerForm = this.formBuilder.group({
    nombre: [this.googleNameParts[0] ?? '', [Validators.required, Validators.pattern(/\S/)]],
    apellido: [this.googleNameParts.slice(1).join(' '), [Validators.required, Validators.pattern(/\S/)]],
    tipo_dni: ['', [Validators.required]],
    dni: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    email: [this.email, [Validators.required, Validators.email]]
  });

  submitted = false;
  loading = false;
  errorMessage = '';

  constructor() {
    if (this.email) this.registerForm.controls.email.disable();
  }

  ngAfterViewInit(): void {
    this.firstName?.nativeElement.focus();
  }

  async submit(): Promise<void> {
    this.submitted = true;
    if (this.registerForm.invalid || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authService.registerGoogleUser(this.registerForm.getRawValue());
      this.completed.emit();
    } catch (error: unknown) {
      if (error instanceof RegistrationSessionError) {
        this.errorMessage = 'El registro se guardó, pero no se pudo iniciar la sesión. Intenta continuar con Google de nuevo.';
      } else if (error instanceof RegistrationSaveError) {
        this.errorMessage = 'No se pudo guardar el registro. Revisa los datos e inténtalo de nuevo.';
      } else {
        this.errorMessage = 'No se pudo completar el registro. Vuelve a intentarlo.';
      }
    } finally {
      this.loading = false;
    }
  }

  cancel(): void {
    if (!this.loading) this.cancelled.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancel();
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTab(event: KeyboardEvent): void {
    const panel = this.panel?.nativeElement;
    if (!panel) return;

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
    ));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
