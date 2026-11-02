import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';
@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements AfterViewInit, OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  private readonly media = matchMedia('(prefers-reduced-motion: reduce)');
  private readonly onMotion = (): void => { if (this.media.matches) this.show(); };
  private show(): void { this.element.nativeElement.classList.add('in'); this.observer?.disconnect(); }
  ngAfterViewInit(): void {
    const element = this.element.nativeElement;
    element.classList.add('reveal');
    if (this.media.matches || !('IntersectionObserver' in window)) { this.show(); return; }
    this.media.addEventListener('change', this.onMotion);
    this.observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) this.show(); }, { threshold: .08 });
    this.observer.observe(element);
  }
  ngOnDestroy(): void { this.observer?.disconnect(); this.media.removeEventListener('change', this.onMotion); }
}
