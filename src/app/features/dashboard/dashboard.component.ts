import { ScrollStackComponent } from '../../shared/components/scroll-stack/scroll-stack.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild, inject, isDevMode, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { AuthService, RegistrationRequiredError } from '../../core/services/auth.service';
import { RegisterComponent } from '../auth/register/register.component';
import { ApiService } from '../../core/services/api.service';
import { Seedbed, SeedbedsService } from '../seedbeds/seedbeds.service';
import { GlitchBackgroundComponent } from '../../shared/components/glitch-background/glitch-background.component';
import { SpecularButtonDirective } from '../../shared/directives/specular-button.directive';

const MEMBER_COUNT_LIMIT = 100;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RegisterComponent, SiteFooterComponent, GlitchBackgroundComponent, SpecularButtonDirective, ScrollStackComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() headerOnly = false;
  @Input() activePage = 'semilleros';
  @ViewChild('mobileNav') private mobileNav?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('authMenu') private authMenu?: ElementRef<HTMLElement>;
  @ViewChild('authMenuTrigger') private authMenuTrigger?: ElementRef<HTMLButtonElement>;
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly seedbedsService = inject(SeedbedsService);
  readonly seedbeds = signal<Seedbed[]>([]);
  readonly memberCount = signal('—');
  readonly seedbedCount = signal('—');
  activeSeedbed = 0;
  menuOpen = false;
  authMenuOpen = false;
  registrationOpen = false;
  authLoading = false;
  authErrorMessage = '';
  headerScrolled = false;
  headerCompact = false;
  activeSection = 'nosotros';
  private previousScrollY = 0;

  get seedbedIcon(): string {
    const name = this.currentSeedbed?.name.toLocaleLowerCase('es') ?? '';
    if (name.includes('ciber')) return 'security';
    if (name.includes('inteligencia')) return 'ai';
    if (name.includes('realidad')) return 'ar';
    return 'research';
  }

  get currentSeedbed(): Seedbed | undefined { return this.seedbeds()[this.activeSeedbed]; }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollY = Math.max(0, window.scrollY);
    if (currentScrollY === 0) this.headerCompact = false;
    else if (currentScrollY !== this.previousScrollY) this.headerCompact = currentScrollY > this.previousScrollY;
    this.previousScrollY = currentScrollY;
    this.headerScrolled = currentScrollY > 80;
    this.updateActiveSection();
  }

  ngOnInit(): void {
    // Every page embeds this component as its header; only the home page shows this content.
    if (this.headerOnly) return;
    this.seedbedsService.list().then(items => { this.seedbeds.set(items); this.seedbedCount.set(String(items.length).padStart(2, '0')); }, () => undefined);
    // GET /members has no total; it returns at most MEMBER_COUNT_LIMIT public profiles.
    this.api.get<{ members: unknown[] | null }>(`/members?limit=${MEMBER_COUNT_LIMIT}`).then(
      ({ members }) => {
        const count = members?.length ?? 0;
        this.memberCount.set(count >= MEMBER_COUNT_LIMIT ? `${MEMBER_COUNT_LIMIT}+` : String(count).padStart(2, '0'));
      },
      () => undefined
    );
  }

  ngAfterViewInit(): void {
    this.updateActiveSection();
  }
  ngOnDestroy(): void { document.body.style.overflow = ''; }

  selectSeedbed(index: number): void { this.activeSeedbed = index; }
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    document.body.style.overflow = this.menuOpen ? 'hidden' : '';
  }
  closeMenu(): void {
    const wasOpen = this.menuOpen;
    this.menuOpen = false;
    document.body.style.overflow = '';
    if (wasOpen) setTimeout(() => this.menuToggle?.nativeElement.focus(), 0);
  }

  toggleAuthMenu(): void {
    if (this.authService.sessionStatus() === 'checking' || this.authLoading) return;
    this.authMenuOpen = !this.authMenuOpen;
    if (this.authMenuOpen) this.authErrorMessage = '';
  }

  async continueWithGoogle(): Promise<void> {
    if (this.authLoading || this.authService.sessionStatus() === 'checking' || this.authService.isAuthenticated()) return;

    this.authLoading = true;
    this.authErrorMessage = '';
    try {
      await this.authService.loginWithGoogle();
      this.authMenuOpen = false;
    } catch (error: unknown) {
      if (error instanceof RegistrationRequiredError) {
        this.authMenuOpen = false;
        this.registrationOpen = true;
        document.body.style.overflow = 'hidden';
      } else {
        // Endpoint, status and CORS details stay out of the UI; they are only logged in development.
        if (isDevMode()) console.warn('[auth] inicio de sesión fallido', error);
        this.authErrorMessage = error instanceof HttpErrorResponse && error.status === 0
          ? 'No hay conexión con el servicio de acceso. Inténtalo de nuevo.'
          : 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
      }
    } finally {
      this.authLoading = false;
    }
  }

  async cancelGoogleRegistration(): Promise<void> {
    this.registrationOpen = false;
    this.authMenuOpen = false;
    document.body.style.overflow = '';
    try {
      await this.authService.cancelGoogleRegistration();
    } catch {
      this.authErrorMessage = 'No se pudo cerrar el acceso de Google. Inténtalo de nuevo.';
    }
    setTimeout(() => this.authMenuTrigger?.nativeElement.focus(), 0);
  }

  onRegistrationComplete(): void {
    this.registrationOpen = false;
    this.authMenuOpen = false;
    document.body.style.overflow = '';
    this.authErrorMessage = '';
    setTimeout(() => this.authMenuTrigger?.nativeElement.focus(), 0);
  }

  async logout(): Promise<void> {
    this.authLoading = true;
    this.authErrorMessage = '';
    try {
      await this.authService.logout();
      this.authMenuOpen = false;
    } catch {
      this.authErrorMessage = 'No se pudo cerrar la sesión correctamente. Inténtalo de nuevo.';
    } finally {
      this.authLoading = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.registrationOpen) return;
    if (this.authMenuOpen) {
      this.authMenuOpen = false;
      setTimeout(() => this.authMenuTrigger?.nativeElement.focus(), 0);
    }
    if (this.menuOpen) this.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.menuOpen && this.mobileNav && !this.mobileNav.nativeElement.contains(target) && !this.menuToggle?.nativeElement.contains(target)) this.closeMenu();
    if (this.authMenuOpen && this.authMenu && !this.authMenu.nativeElement.contains(target)) this.authMenuOpen = false;
  }

  private updateActiveSection(): void {
    if (this.headerOnly) {
      return;
    }
    const viewportCenter = window.innerHeight / 2;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('#contenido > section, .site-footer-anchor'))
      .filter(section => section.id);
    const current = sections.find(section => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= viewportCenter && bounds.bottom >= viewportCenter;
    });
    if (current) this.activeSection = current.id;
  }

}
