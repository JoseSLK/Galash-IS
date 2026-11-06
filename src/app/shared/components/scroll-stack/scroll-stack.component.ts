import { afterEveryRender, Component, ElementRef, NgZone, OnDestroy, ViewEncapsulation, inject } from '@angular/core';
import type { Root } from 'react-dom/client';

@Component({
  selector: 'app-scroll-stack',
  standalone: true,
  template: '<div class="galash-scroll-stack" role="region" aria-label="Conoce GALASH: tarjetas apilables" tabindex="0"></div>',
  styleUrls: ['./galash-scroll-stack.css'],
  encapsulation: ViewEncapsulation.None
})
export class ScrollStackComponent implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private root?: Root;
  private destroyed = false;
  private mounting = false;
  private nearViewport = false;
  private observer?: IntersectionObserver;

  constructor() {
    afterEveryRender(() => {
      if (!this.observer) {
        this.zone.runOutsideAngular(() => {
          this.observer = new IntersectionObserver(entries => {
            this.nearViewport = entries[0]?.isIntersecting ?? false;
            this.mountIfVisible();
          }, { rootMargin: '200px' });
          this.observer.observe(this.host.nativeElement);
        });
      }
      this.mountIfVisible();
    });
  }

  private mountIfVisible(): void {
    const mount = this.host.nativeElement.querySelector<HTMLDivElement>('.galash-scroll-stack');
    // Also recover React-owned DOM after Angular's development template refresh.
    if (this.nearViewport && mount && !mount.childElementCount && !this.mounting && !this.destroyed) {
      void this.mountReact(mount);
    }
  }

  private async mountReact(mount: HTMLDivElement): Promise<void> {
    this.mounting = true;
    try {
    const [{ createElement: h }, { createRoot }, { default: ScrollStack, ScrollStackItem }] = await Promise.all([
      import('react'), import('react-dom/client'), import('./ScrollStack.js')
    ]);
    if (this.destroyed) return;
    this.zone.runOutsideAngular(() => {
      const cards = [
        { image: 'fondo.png', alt: 'Comunidad GALASH en la UPTC', label: '01 · Nuestra comunidad', title: 'Ideas que nos conectan' },
        { image: 'img1.jpeg', alt: 'Encuentro de integrantes del semillero', label: '02 · Nuestros semilleros', title: 'Aprendemos juntos' },
        { image: 'img2.jpeg', alt: 'Exposición de ingeniería en la UPTC', label: '03 · Investigación', title: 'Preguntas que abren caminos' }
      ];
      this.root?.unmount();
      this.root = createRoot(mount);
      this.root.render(h(ScrollStack, { itemDistance: 16, stackPosition: 88, holdDistance: 0, useWindowScroll: true, smoothScroll: false }, cards.map(card => h(ScrollStackItem, { key: card.image, itemClassName: 'galash-stack-card' },
        h('img', { src: `assets/${card.image}`, alt: card.alt, loading: 'lazy' }),
        h('div', { className: 'galash-stack-caption' }, h('span', {}, card.label), h('h3', {}, card.title))
      ))));
    });
    } finally {
      this.mounting = false;
    }
  }

  ngOnDestroy(): void { this.destroyed = true; this.observer?.disconnect(); this.root?.unmount(); }
}
