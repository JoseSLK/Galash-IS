import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject, isDevMode } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, RegistrationRequiredError } from '../../core/services/auth.service';
import { RegisterComponent } from '../auth/register/register.component';
import { carouselConfig, heroSlides, seedbeds, Seedbed, mosaicContent } from './dashboard-content';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RegisterComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mobileNav') private mobileNav?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('authMenu') private authMenu?: ElementRef<HTMLElement>;
  @ViewChild('authMenuTrigger') private authMenuTrigger?: ElementRef<HTMLButtonElement>;
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly authService = inject(AuthService);
  readonly heroSlides = heroSlides;
  readonly seedbeds = seedbeds;
  readonly mosaicContent = mosaicContent;
  activeSlide = 0;
  activeSeedbed = 0;
  menuOpen = false;
  authMenuOpen = false;
  registrationOpen = false;
  authLoading = false;
  authErrorMessage = '';
  headerScrolled = false;
  headerCompact = false;
  carouselPaused = false;
  carouselProgress = 0;
  carouselLive: 'off' | 'polite' = 'off';
  activeSection = 'nosotros';
  private timerInterval = 0;
  private timerStart = 0;
  private elapsed = 0;
  private focused = false;
  private touchStartX?: number;
  private previousScrollY = 0;

  get currentSeedbed(): Seedbed { return this.seedbeds[this.activeSeedbed]; }
  get slideCounter(): string { return String(this.activeSlide + 1).padStart(2, '0'); }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollY = Math.max(0, window.scrollY);
    if (currentScrollY === 0) this.headerCompact = false;
    else if (currentScrollY !== this.previousScrollY) this.headerCompact = currentScrollY > this.previousScrollY;
    this.previousScrollY = currentScrollY;
    this.headerScrolled = currentScrollY > 80;
    this.updateActiveSection();
  }

  ngAfterViewInit(): void {
    this.updateActiveSection();
    this.updateTimerState();
  }
  ngOnDestroy(): void { this.stopTimer(); document.body.style.overflow = ''; }

  nextSlide(): void { this.changeSlide((this.activeSlide + 1) % this.heroSlides.length); }
  previousSlide(): void { this.changeSlide((this.activeSlide - 1 + this.heroSlides.length) % this.heroSlides.length); }
  selectSlide(index: number): void { this.changeSlide(index); }
  toggleCarousel(): void { this.carouselPaused = !this.carouselPaused; this.carouselLive = this.carouselPaused ? 'polite' : 'off'; this.updateTimerState(); }
  onCarouselFocusIn(): void { this.focused = true; this.updateTimerState(); }
  onCarouselFocusOut(event: FocusEvent): void {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
      this.focused = false;
      this.updateTimerState();
    }
  }
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

  onTouchStart(event: TouchEvent): void { this.touchStartX = event.changedTouches[0]?.clientX; }
  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === undefined) return;
    const distance = event.changedTouches[0]?.clientX - this.touchStartX;
    if (Math.abs(distance) > 45) distance < 0 ? this.nextSlide() : this.previousSlide();
    this.touchStartX = undefined;
  }
  onHeroKeydown(event: KeyboardEvent): void { if (event.key === 'ArrowRight') this.nextSlide(); if (event.key === 'ArrowLeft') this.previousSlide(); }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void { this.updateTimerState(); }

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

  private changeSlide(index: number): void {
    this.activeSlide = index;
    this.elapsed = 0;
    this.carouselProgress = 0;
    this.carouselLive = 'polite';
    this.stopTimer();
    this.updateTimerState();
  }

  private updateActiveSection(): void {
    const viewportCenter = window.innerHeight / 2;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('#contenido > section, .site-footer'))
      .filter(section => section.id);
    const current = sections.find(section => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= viewportCenter && bounds.bottom >= viewportCenter;
    });
    if (current) this.activeSection = current.id;
  }

  private advanceSlide(): void {
    this.activeSlide = (this.activeSlide + 1) % this.heroSlides.length;
    this.elapsed = 0;
    this.carouselProgress = 0;
    this.carouselLive = 'off';
  }

  private updateTimerState(): void {
    const shouldRun = !this.carouselPaused && !document.hidden;
    this.carouselLive = shouldRun ? 'off' : 'polite';
    if (shouldRun) this.startTimer(); else this.stopTimer();
  }

  private startTimer(): void {
    if (this.timerInterval) return;
    this.timerStart = performance.now() - this.elapsed;
    this.timerInterval = window.setInterval(() => this.tickTimer(), 50);
  }

  private stopTimer(): void {
    if (!this.timerInterval) return;
    window.clearInterval(this.timerInterval);
    this.timerInterval = 0;
  }

  private tickTimer = (): void => {
    this.elapsed = performance.now() - this.timerStart;
    if (this.elapsed >= carouselConfig.duration) {
      this.advanceSlide();
      this.timerStart = performance.now();
    }
    this.carouselProgress = Math.min(1, this.elapsed / carouselConfig.duration);
    this.changeDetector.markForCheck();
  }
}
