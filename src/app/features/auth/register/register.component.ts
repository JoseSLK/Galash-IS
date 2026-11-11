import { AfterViewInit, OnInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Output, ViewChild, signal, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import {
  AuthService,
  RegistrationMatch,
  RegistrationConflictError,
  RegistrationSaveError,
  RegistrationSessionError
} from '../../../core/services/auth.service';

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const notFuture: ValidatorFn = control => !control.value || control.value <= today() ? null : { future: true };

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements AfterViewInit, OnInit {
  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;
  @ViewChild('firstName') private firstName?: ElementRef<HTMLInputElement>;
  @Output() readonly completed = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();

  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  readonly email = this.authService.currentUser()?.email ?? '';
  // With a backend session open, the drawer completes the basic data of an existing account.
  readonly updating = this.authService.isAuthenticated();
  readonly maxDate = today();
  private readonly account = this.authService.backendUser();
  private readonly googleNameParts = (this.authService.currentUser()?.displayName ?? '').trim().split(/\s+/).filter(Boolean);
  readonly registerForm = this.formBuilder.group({
    nombre: [this.account?.name || this.googleNameParts[0] || '', [Validators.required, Validators.pattern(/\S/)]],
    apellido: [this.account?.last_name || this.googleNameParts.slice(1).join(' '), [Validators.required, Validators.pattern(/\S/)]],
    tipo_dni: [this.account?.document_type ?? '', [Validators.required]],
    dni: [this.account?.document_number ?? '', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    email: [this.email, [Validators.required, Validators.email]],
    fecha_nacimiento: [this.account?.birth_date ?? '', [Validators.required, notFuture]],
    telefono: [this.account?.phone ?? '', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
    codigo_estudiantil: [this.account?.student_code ?? '', [Validators.pattern(/^\d*$/)]]
  });

  readonly matches = signal<RegistrationMatch[]>([]);
  readonly matchesLoading = signal(false);
  readonly matchesError = signal('');
  matchChoice: string | null = null;

  submitted = false;
  loading = false;
  errorMessage = '';

  constructor() {
    if (this.email) this.registerForm.controls.email.disable();
  }

  ngOnInit(): void { if (!this.updating) void this.loadMatches(); }

  async loadMatches(): Promise<void> {
    if (this.updating || this.matchesLoading()) return;
    this.matchesLoading.set(true); this.matchesError.set(''); this.matchChoice = null;
    try { this.matches.set(await this.authService.registrationMatches()); }
    catch { this.matches.set([]); this.matchesError.set('No pudimos comprobar si ya tienes un perfil importado. Reintenta para continuar.'); }
    finally { this.matchesLoading.set(false); this.changeDetector.markForCheck(); }
  }

  ngAfterViewInit(): void {
    this.firstName?.nativeElement.focus();
  }

  async submit(): Promise<void> {
    this.submitted = true;
    if (this.registerForm.invalid || this.loading || this.matchesLoading() || this.matchesError()) return;
    if (!this.updating && this.matches().length && (this.matchChoice === null || (this.matchChoice && !this.matches().some(item => item.id === this.matchChoice)))) {
      this.errorMessage = 'Indica si alguno de los perfiles te corresponde antes de continuar.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authService.registerGoogleUser({ ...this.registerForm.getRawValue(), ...(!this.updating && this.matchChoice ? { claim_id: this.matchChoice } : {}) });
      this.completed.emit();
    } catch (error: unknown) {
      if (error instanceof RegistrationConflictError) {
        this.errorMessage = this.matchChoice ? 'No se pudo vincular el perfil: puede haber sido reclamado o tus datos ya pertenecen a otra cuenta. Revisa tu elección e inténtalo de nuevo.' : 'El documento o el código estudiantil ya pertenecen a otra cuenta.';
      } else if (error instanceof RegistrationSessionError) {
        this.errorMessage = 'El registro se guardó, pero no se pudo iniciar la sesión. Intenta continuar con Google de nuevo.';
      } else if (error instanceof RegistrationSaveError) {
        this.errorMessage = 'No se pudo guardar el registro. Revisa los datos e inténtalo de nuevo.';
      } else {
        this.errorMessage = 'No se pudo completar el registro. Vuelve a intentarlo.';
      }
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
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
