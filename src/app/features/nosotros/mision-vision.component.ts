import { InstitutionalIconComponent } from './animated-icon.component';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, ViewChild, signal } from '@angular/core';
import { RevealDirective } from './reveal.directive';
import { ContenidoInstitucional } from './institucional.models';
@Component({ selector: 'app-nosotros-mision-vision', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [RevealDirective, InstitutionalIconComponent], templateUrl: './mision-vision.component.html', styleUrls: ['./universo.css', './mision-vision.component.css'] })
export class NosotrosMisionVisionComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) contenido!: ContenidoInstitucional;
  @ViewChild('stage', { static: true }) private stage!: ElementRef<HTMLElement>;
  readonly selected = signal(0);
  readonly labels = ['Misión', 'Visión'];
  readonly litWords = signal(0);
  private holdTicks = 0;
  private timer?: ReturnType<typeof setInterval>;
  private observer?: IntersectionObserver;
  private visible = false;
  private focused = false;
  get text(): string { return [this.contenido.mision, this.contenido.vision][this.selected()] || ''; }
  get words(): string[] { return this.text.trim().split(/\s+/).filter(Boolean); }
  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(entries => { const entering = entries[0].isIntersecting && !this.visible; this.visible = entries[0].isIntersecting; if (entering) this.resetReveal(); this.sync(); }, { threshold: .15 });
    this.observer.observe(this.stage.nativeElement);
    document.addEventListener('visibilitychange', this.sync);
  }
  choose(index: number): void { this.selected.set(index); this.resetReveal(); this.sync(); }
  private resetReveal(): void { this.litWords.set(0); this.holdTicks = 0; }
  focusIn(): void { this.focused = true; this.sync(); }
  focusOut(event: FocusEvent): void {
    if (this.stage.nativeElement.contains(event.relatedTarget as Node | null)) return;
    this.focused = false; this.sync();
  }
  private readonly sync = (): void => {
    clearInterval(this.timer);
    if (!this.visible || document.hidden) return;
    this.timer = setInterval(() => {
      if (this.litWords() < this.words.length) { this.litWords.update(count => count + 1); return; }
      if (this.focused) return;
      if (++this.holdTicks >= 18) this.choose((this.selected() + 1) % this.labels.length);
    }, 120);
  };
  ngOnDestroy(): void { clearInterval(this.timer); this.observer?.disconnect(); document.removeEventListener('visibilitychange', this.sync); }
}
