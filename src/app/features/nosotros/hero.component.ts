import { HeroAcronimoComponent } from './hero-acronimo.component';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { ContenidoInstitucional } from './institucional.models';
import { cssColorString } from '../../shared/css-color';
interface Star { x: number; y: number; vx: number; vy: number; near: boolean; }
@Component({ selector: 'app-nosotros-hero', standalone: true, imports: [HeroAcronimoComponent], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './hero.component.html', styleUrls: ['./universo.css', './hero.component.css'] })
export class NosotrosHeroComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) contenido!: ContenidoInstitucional;
  @ViewChild('field', { static: true }) private field!: ElementRef<HTMLCanvasElement>;
  private readonly zone = inject(NgZone);
  private context: CanvasRenderingContext2D | null = null;
  private stars: Star[] = [];
  private colors = { line: '', star: '', near: '' };
  private width = 0; private height = 0; private frame = 0; private last = 0;
  private visible = false; private destroyed = false;
  private pointer: { x: number; y: number } | null = null;
  private resize?: ResizeObserver; private intersection?: IntersectionObserver;
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)');
  private readonly mobile = matchMedia('(max-width: 767px)');
  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.context = this.field.nativeElement.getContext('2d');
      if (!this.context) return;
      this.colors = { line: cssColorString('--galash-secondary'), star: cssColorString('--galash-secondary'), near: cssColorString('--galash-text-strong') };
      this.resize = new ResizeObserver(() => this.size()); this.resize.observe(this.field.nativeElement);
      this.intersection = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; this.sync(); }); this.intersection.observe(this.field.nativeElement);
      this.motion.addEventListener('change', this.onPreference); this.mobile.addEventListener('change', this.onPreference);
      document.addEventListener('visibilitychange', this.sync);
      this.field.nativeElement.parentElement?.addEventListener('pointermove', this.onPointer);
      this.field.nativeElement.parentElement?.addEventListener('pointerleave', this.onLeave);
      this.size();
    });
  }
  private readonly onPointer = (event: PointerEvent): void => {
    if (this.mobile.matches || this.motion.matches) return;
    const rect = this.field.nativeElement.getBoundingClientRect(); this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  private readonly onLeave = (): void => { this.pointer = null; };
  private readonly onPreference = (): void => { this.pointer = null; this.size(); this.sync(); };
  private size(): void {
    const canvas = this.field.nativeElement; const rect = canvas.getBoundingClientRect();
    this.width = rect.width; this.height = rect.height;
    const ratio = window.devicePixelRatio || 1; canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    this.context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.stars = Array.from({ length: this.mobile.matches ? 45 : 100 }, () => ({ x: Math.random() * this.width, y: Math.random() * this.height, vx: (Math.random() - .5) * 12, vy: (Math.random() - .5) * 12, near: false }));
    this.draw(0);
  }
  private readonly sync = (): void => {
    cancelAnimationFrame(this.frame); this.last = 0;
    if (!this.destroyed && this.visible && !document.hidden) this.frame = requestAnimationFrame(this.tick);
    else this.draw(0);
  };
  private readonly tick = (time: number): void => {
    if (this.destroyed) return;
    this.frame = requestAnimationFrame(this.tick);
    if (this.last && time - this.last < 32) return;
    const elapsed = this.last ? Math.min(.05, (time - this.last) / 1000) : 0; this.last = time; this.draw(elapsed);
  };
  private draw(elapsed: number): void {
    const ctx = this.context; if (!ctx) return;
    ctx.clearRect(0, 0, this.width, this.height);
    for (const star of this.stars) {
      const dx = star.x - (this.pointer?.x ?? -1000), dy = star.y - (this.pointer?.y ?? -1000); const distance = Math.hypot(dx, dy);
      star.near = !!this.pointer && distance < 140;
      star.x += star.vx * elapsed; star.y += star.vy * elapsed;
      if (star.near && distance > 0) { star.x += dx / distance * (140 - distance) * elapsed; star.y += dy / distance * (140 - distance) * elapsed; }
      star.x = (star.x + this.width) % (this.width || 1); star.y = (star.y + this.height) % (this.height || 1);
    }
    for (let i = 0; i < this.stars.length; i++) for (let j = i + 1; j < this.stars.length; j++) {
      const a = this.stars[i], b = this.stars[j]; const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance >= 180) continue;
      ctx.globalAlpha = (1 - distance / 180) * .5; ctx.strokeStyle = this.colors.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = .8;
    for (const star of this.stars) { ctx.fillStyle = star.near ? this.colors.near : this.colors.star; ctx.beginPath(); ctx.arc(star.x, star.y, star.near ? 3 : 2.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  ngOnDestroy(): void {
    this.destroyed = true; cancelAnimationFrame(this.frame); this.resize?.disconnect(); this.intersection?.disconnect();
    this.motion.removeEventListener('change', this.onPreference); this.mobile.removeEventListener('change', this.onPreference); document.removeEventListener('visibilitychange', this.sync);
    this.field.nativeElement.parentElement?.removeEventListener('pointermove', this.onPointer); this.field.nativeElement.parentElement?.removeEventListener('pointerleave', this.onLeave);
  }
}
