import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy, Renderer2, RendererStyleFlags2, inject } from '@angular/core';

/** Pointer-driven specular light on a native button; preserves its semantics and click flow. */
@Directive({
  selector: 'button[appSpecularButton]', standalone: true,
  host: { '[class.rb-specular]': 'appSpecularButton' }
})
export class SpecularButtonDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input() appSpecularButton = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'lg';
  @Input() radius = 18;
  @Input() tint = '#ffffff';
  @Input() tintOpacity = 0.04;
  @Input() textColor = '#f5f5f5';
  @Input() lineColor = '#ffffff';
  @Input() baseColor = '#525252';
  @Input() intensity = 1;
  @Input() idleIntensity = 0.35;
  @Input() shineSize = 10;
  @Input() shineFade = 34;
  @Input() thickness = 1.2;
  @Input() glow = 1;
  @Input() followMouse = true;
  @Input() proximity = 250;
  private readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private frame = 0;
  private pointer?: { x: number; y: number };
  private readonly cleanups: (() => void)[] = [];

  ngOnChanges(): void {
    const values: Record<string, string> = {
      radius: `${this.radius}px`, tint: this.tint, 'tint-opacity': `${this.tintOpacity * 100}%`,
      text: this.textColor, line: this.lineColor, base: this.baseColor,
      strength: String(this.idleIntensity), 'shine-size': `${this.shineSize}deg`,
      'shine-fade': `${this.shineFade}deg`, thickness: `${this.thickness}px`, glow: String(this.glow),
      height: this.size === 'lg' ? '44px' : this.size === 'sm' ? '34px' : '38px'
    };
    for (const [key, value] of Object.entries(values)) this.style(key, value);
    this.style('x', '50%'); this.style('y', '0%'); this.style('angle', '-180deg');
  }
  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.cleanups.push(this.renderer.listen('document', 'pointermove', (event: PointerEvent) => {
        if (event.pointerType === 'touch' || !this.appSpecularButton || this.element.nativeElement.disabled) return;
        this.pointer = { x: event.clientX, y: event.clientY };
        this.queue();
      }));
      this.cleanups.push(this.renderer.listen('document', 'pointerleave', () => this.reset()));
      this.cleanups.push(this.renderer.listen('window', 'blur', () => this.reset()));
      this.cleanups.push(this.renderer.listen('window', 'scroll', () => this.reset()));
      this.cleanups.push(this.renderer.listen(this.element.nativeElement, 'focus', () => {
        this.style('strength', String(this.intensity)); this.style('x', '50%'); this.style('y', '0%');
      }));
      this.cleanups.push(this.renderer.listen(this.element.nativeElement, 'blur', () => this.reset()));
    });
  }
  private queue(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.update(); });
  }
  private update(): void {
    if (!this.pointer || !this.appSpecularButton || this.element.nativeElement.disabled) return;
    const rect = this.element.nativeElement.getBoundingClientRect();
    const dx = Math.max(rect.left - this.pointer.x, 0, this.pointer.x - rect.right);
    const dy = Math.max(rect.top - this.pointer.y, 0, this.pointer.y - rect.bottom);
    const distance = Math.hypot(dx, dy);
    const influence = Math.max(0, 1 - distance / Math.max(1, this.proximity));
    this.style('strength', String(this.idleIntensity + (this.intensity - this.idleIntensity) * influence));
    if (this.followMouse && influence > 0) {
      this.style('x', `${this.pointer.x - rect.left}px`);
      this.style('y', `${this.pointer.y - rect.top}px`);
      const angle = Math.atan2(this.pointer.y - rect.top - rect.height / 2, this.pointer.x - rect.left - rect.width / 2) * 180 / Math.PI - 90;
      this.style('angle', `${angle}deg`);
    }
  }
  private reset(): void {
    cancelAnimationFrame(this.frame); this.frame = 0; this.pointer = undefined;
    this.style('strength', String(this.idleIntensity));
  }
  private style(name: string, value: string): void {
    this.renderer.setStyle(this.element.nativeElement, `--spec-${name}`, value, RendererStyleFlags2.DashCase);
  }
  ngOnDestroy(): void { cancelAnimationFrame(this.frame); this.cleanups.forEach(cleanup => cleanup()); }
}
