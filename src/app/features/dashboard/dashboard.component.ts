import { ScrollStackComponent } from '../../shared/components/scroll-stack/scroll-stack.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, NgZone, OnDestroy, OnInit, ViewChild, inject, isDevMode, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialLinksComponent } from '../../shared/components/social-links/social-links.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { AuthService, RegistrationRequiredError } from '../../core/services/auth.service';
import { RegisterComponent } from '../auth/register/register.component';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { ApiService } from '../../core/services/api.service';
import { Seedbed, SeedbedsService, seedbedAbbreviation } from '../seedbeds/seedbeds.service';
import { GlitchBackgroundComponent } from '../../shared/components/glitch-background/glitch-background.component';
import { INITIAL_HEADER_SCROLL, nextHeaderState, lastIndexAbove } from './header-scroll';
import { LeaderSeedbed, LeaderService } from '../leader/leader.service';

const MEMBER_COUNT_LIMIT = 100;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NotificationBellComponent, RegisterComponent, SiteFooterComponent, SocialLinksComponent, GlitchBackgroundComponent, ScrollStackComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly abbreviation = seedbedAbbreviation;
  @Input() headerOnly = false;
  @Input() activePage = 'semilleros';
  @ViewChild('mobileNav') private mobileNav?: ElementRef<HTMLElement>;
  @ViewChild('seedbedBlocks') private seedbedBlocks?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('authMenu') private authMenu?: ElementRef<HTMLElement>;
  @ViewChild('authMenuTrigger') private authMenuTrigger?: ElementRef<HTMLButtonElement>;
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly seedbedsService = inject(SeedbedsService);
  private readonly leaderService = inject(LeaderService);
  readonly ownedSeedbeds = signal<LeaderSeedbed[]>([]);
  readonly checkingLeadership = signal(false);
  readonly leadershipError = signal(false);
  private leadershipRequest = 0;
  readonly seedbeds = signal<Seedbed[]>([]);
  readonly memberCount = signal('—');
  readonly seedbedCount = signal('—');
  readonly projectCount = signal('—');
  activeSeedbed = 0;
  menuOpen = false;
  authMenuOpen = false;
  registrationOpen = false;
  authLoading = false;
  authErrorMessage = '';
  emailAddress = '';
  emailLinkSent = false;
  emailLinkNeedsEmail = false;
  headerScrolled = false;
  headerCompact = false;
  activeSection = 'nosotros';
  private readonly zone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private headerState = INITIAL_HEADER_SCROLL;
  private scrollFrame = 0;
  private removeScrollListener?: () => void;

  iconFor(seedbed: Seedbed): string {
    const name = seedbed.name.toLocaleLowerCase('es');
    if (name.includes('big data') || name.includes('cloud')) return 'cloud';
    if (name.includes('ciber')) return 'security';
    if (name.includes('algor')) return 'algorithm';
    if (name.includes('innovaci')) return 'innovation';
    if (name.includes('distribuido') || name.includes('devops')) return 'distributed';
    if (name.includes('inteligencia')) return 'ai';
    if (name.includes('realidad')) return 'ar';
    return 'research';
  }

  /** Runs once per frame outside Angular; re-enters the zone only when the header state changes. */
  private syncHeader(): void {
    this.scrollFrame = 0;
    const y = Math.max(0, window.scrollY);
    this.headerState = nextHeaderState(this.headerState, y);
    const scrolled = y > 80;
    const section = this.activeSection;
    this.updateActiveSection();
    const seedbed = this.seedbedFromScroll();
    if (this.headerState.compact !== this.headerCompact || scrolled !== this.headerScrolled || section !== this.activeSection || seedbed !== this.activeSeedbed) {
      this.zone.run(() => {
        this.activeSeedbed = seedbed;
        this.headerCompact = this.headerState.compact;
        this.headerScrolled = scrolled;
        this.changeDetector.markForCheck();
      });
    }
  }

  ngOnInit(): void {
    // The email sign-in link returns to this URL; every page embeds this header.
    void this.finishPendingEmailLink();
    // Every page embeds this component as its header; only the home page shows this content.
    if (this.headerOnly) return;
    this.seedbedsService.list().then(items => { this.seedbeds.set(items); this.seedbedCount.set(String(items.length).padStart(2, '0')); }, () => undefined);
    this.api.get<{ projects: unknown[] | null }>('/projects').then(
      ({ projects }) => this.projectCount.set(String(projects?.length ?? 0).padStart(2, '0')),
      () => undefined
    );
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
    this.zone.runOutsideAngular(() => {
      const onScroll = () => { if (!this.scrollFrame) this.scrollFrame = requestAnimationFrame(() => this.syncHeader()); };
      window.addEventListener('scroll', onScroll, { passive: true });
      this.removeScrollListener = () => window.removeEventListener('scroll', onScroll);
    });
  }
  ngOnDestroy(): void {
    this.leadershipRequest++;
    document.body.style.overflow = '';
    cancelAnimationFrame(this.scrollFrame);
    this.removeScrollListener?.();
  }

  private seedbedBlockList(): HTMLElement[] {
    return Array.from(this.seedbedBlocks?.nativeElement.children ?? []) as HTMLElement[];
  }
  /** El semillero activo del índice lateral es el último bloque que cruzó la mitad de la ventana. */
  private seedbedFromScroll(): number {
    return lastIndexAbove(this.seedbedBlockList().map(block => block.getBoundingClientRect().top), window.innerHeight / 2);
  }
  selectSeedbed(index: number): void {
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    this.seedbedBlockList()[index]?.scrollIntoView({ behavior, block: 'center' });
  }

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
    if (this.authMenuOpen) {
      this.authErrorMessage = '';
      if (this.authService.isAuthenticated() && !this.authService.isAdmin()) void this.checkLeadership();
    }
  }

  async checkLeadership(): Promise<void> {
    const request = ++this.leadershipRequest;
    const userId = this.authService.backendUser()?.id;
    this.ownedSeedbeds.set([]); this.checkingLeadership.set(true); this.leadershipError.set(false);
    try {
      const owned = await this.leaderService.owned();
      if (request === this.leadershipRequest && userId === this.authService.backendUser()?.id) this.ownedSeedbeds.set(owned);
    } catch { if (request === this.leadershipRequest) this.leadershipError.set(true); }
    finally { if (request === this.leadershipRequest) this.checkingLeadership.set(false); }
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
        this.openRegistration();
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

  async submitEmailLogin(): Promise<void> {
    if (this.authLoading || this.authService.sessionStatus() === 'checking' || this.authService.isAuthenticated()) return;

    this.authLoading = true;
    this.authErrorMessage = '';
    const completing = this.emailLinkNeedsEmail;
    try {
      if (completing) {
        await this.authService.loginWithEmailLink(this.emailAddress);
        this.emailLinkNeedsEmail = false;
        this.authMenuOpen = false;
      } else {
        await this.authService.sendEmailSignInLink(this.emailAddress);
        this.emailLinkSent = true;
      }
    } catch (error: unknown) {
      if (error instanceof RegistrationRequiredError) {
        this.openRegistration();
      } else {
        // Endpoint, status and CORS details stay out of the UI; they are only logged in development.
        if (isDevMode()) console.warn('[auth] acceso por correo fallido', error);
        this.emailLinkNeedsEmail = false;
        this.emailLinkSent = false;
        this.authErrorMessage = completing
          ? 'El enlace venció o no coincide con ese correo. Solicita uno nuevo.'
          : 'No se pudo enviar el enlace. Revisa el correo e inténtalo de nuevo.';
      }
    } finally {
      this.authLoading = false;
    }
  }

  private async finishPendingEmailLink(): Promise<void> {
    if (this.authService.isAuthenticated() || !(await this.authService.pendingEmailLinkLogin())) return;

    this.authMenuOpen = true;
    // The link opened on a device without the stored address; ask for it once.
    if (!this.authService.storedEmailLinkAddress()) {
      this.emailLinkNeedsEmail = true;
      return;
    }
    this.authLoading = true;
    try {
      await this.authService.loginWithEmailLink();
      this.authMenuOpen = false;
    } catch (error: unknown) {
      if (error instanceof RegistrationRequiredError) {
        this.openRegistration();
      } else {
        if (isDevMode()) console.warn('[auth] acceso por correo fallido', error);
        this.emailLinkNeedsEmail = true;
        this.authErrorMessage = 'El enlace venció o es inválido. Confirma tu correo o solicita uno nuevo.';
      }
    } finally {
      this.authLoading = false;
    }
  }

  /** Opens the signup drawer; with a session open it completes the account's basic data. */
  openRegistration(): void {
    this.authMenuOpen = false;
    this.registrationOpen = true;
    document.body.style.overflow = 'hidden';
  }

  async cancelGoogleRegistration(): Promise<void> {
    this.registrationOpen = false;
    this.authMenuOpen = false;
    document.body.style.overflow = '';
    // Closing the data completion of a signed-in account must not end its session.
    if (!this.authService.isAuthenticated()) {
      try {
        await this.authService.cancelGoogleRegistration();
      } catch {
        this.authErrorMessage = 'No se pudo cerrar el acceso de Google. Inténtalo de nuevo.';
      }
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
