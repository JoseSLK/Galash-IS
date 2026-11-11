import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject, isDevMode } from '@angular/core';
import { cssColor } from '../../css-color';
import type { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderer } from 'three';

const FRAME_INTERVAL_MS = 1000 / 60;
const ANIMATION_SPEED = 1.5;
const MAX_BACKGROUND_PIXELS = 1280 * 720;
type Rgb = [number, number, number];
const vec3 = ([r, g, b]: Rgb): string => `vec3(${r.toFixed(4)}, ${g.toFixed(4)}, ${b.toFixed(4)})`;

// Token colors are inlined as GLSL constants (not uniforms) so the compiler can fold them; software WebGL is measurably slower with uniforms.
const fragmentShader = (c: { base: Rgb; wave: Rgb; highlight: Rgb }) => `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
const vec3 uBase = ${vec3(c.base)};
const vec3 uWave = ${vec3(c.wave)};
const vec3 uHighlight = ${vec3(c.highlight)};
// Keep decorative light restrained behind the hero text.
const float WAVE_GAIN = 0.60;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float particles(vec2 uv, float scale, float speed, float seed) {
  vec2 moving = uv * vec2(scale, scale * 0.65);
  // Stable cells drift upward together; only particles outside the view wrap.
  moving.y -= uTime * speed;
  vec2 cell = floor(moving);
  vec2 point = fract(moving) - vec2(0.25 + hash(cell + seed) * 0.5, 0.5);
  point.x += sin(uTime * 0.16 + hash(cell + seed) * 6.28) * 0.08;
  float dotLight = 1.0 - smoothstep(0.012, 0.055, length(point));
  float selected = step(0.965, hash(cell + seed + 13.0));
  float fade = smoothstep(0.0, 0.12, uv.y) * (1.0 - smoothstep(0.85, 1.0, uv.y));
  return dotLight * selected * fade * (0.55 + 0.15 * sin(uTime * 0.6 + hash(cell) * 6.28));
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec3 color = uBase;

  // A broad horizon glow breathes slowly instead of a flickering ribbon.
  float horizon = 0.24 + sin(uTime * 0.18) * 0.008;
  float spread = 1.0 + sin(uTime * 0.22) * 0.07;
  vec2 light = vec2(p.x / spread, (uv.y - horizon) * 3.8);
  float halo = exp(-dot(light, light) * 2.2);
  float crest = exp(-pow((uv.y - horizon) * 25.0, 2.0)) * exp(-p.x * p.x * 1.3);
  color += uWave * WAVE_GAIN * (halo * 0.50 + crest * 0.26);

  // Perspective lines remain coherent; motion has no random row offsets.
  float distanceToHorizon = abs(uv.y - 0.49);
  float depth = max(0.065, distanceToHorizon);
  vec2 world = vec2(p.x / depth, 0.70 / depth - uTime * 0.12);
  vec2 cell = abs(fract(world * 0.85 + 0.5) - 0.5);
  vec2 edge = max(fwidth(world * 0.85), vec2(0.001));
  vec2 lines = 1.0 - smoothstep(vec2(0.0), edge * 1.2, cell);
  float grid = max(lines.x, lines.y);
  float gridFade = smoothstep(0.08, 0.32, distanceToHorizon);
  gridFade *= 0.45 + halo * 0.55;
  color += uWave * WAVE_GAIN * grid * gridFade * 0.16;

  color += uHighlight * (particles(uv, 55.0, 0.22, 3.0) * 0.50
    + particles(uv, 33.0, 0.12, 17.0) * 0.28);
  float sideFade = 1.0 - smoothstep(0.25, 0.65, abs(uv.x - 0.5));
  color = mix(uBase, color, sideFade);
  gl_FragColor = vec4(color, 1.0);
}`;

@Component({
  selector: 'app-glitch-background',
  standalone: true,
  template: `<canvas #surface aria-hidden="true"></canvas>`,
  styles: `:host{position:absolute;inset:0;display:block;overflow:hidden;pointer-events:none;background:var(--galash-bg)}canvas{display:block;width:100%;height:100%}`
})
export class GlitchBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('surface', { static: true }) private surface!: ElementRef<HTMLCanvasElement>;
  private readonly zone = inject(NgZone);
  private renderer?: WebGLRenderer;
  private scene?: Scene;
  private camera?: OrthographicCamera;
  private mesh?: Mesh<PlaneGeometry, ShaderMaterial>;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private visible = false;
  private destroyed = false;
  private frame = 0;
  private previousTime = 0;
  private elapsed = 12;
  private frameAccumulator = FRAME_INTERVAL_MS;
  private ready = false;
  private width = 0;
  private height = 0;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      document.addEventListener('visibilitychange', this.onVisibility);
      this.intersectionObserver = new IntersectionObserver(entries => {
        this.visible = entries[0]?.isIntersecting ?? false;
        this.sync();
      });
      this.intersectionObserver.observe(this.surface.nativeElement);
      void this.initialize();
    });
  }

  private async initialize(): Promise<void> {
    try {
      const { WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, ShaderMaterial, Mesh, Vector2 } = await import('three');
      if (this.destroyed) return;
      this.renderer = new WebGLRenderer({ canvas: this.surface.nativeElement, antialias: false, powerPreference: 'low-power' });
      this.scene = new Scene();
      this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.mesh = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
        uniforms: { uTime: { value: this.elapsed }, uResolution: { value: new Vector2(1, 1) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        // Colors come from CSS tokens (styles.css), never duplicated here.
        fragmentShader: fragmentShader({ base: cssColor('--galash-deep'), wave: cssColor('--galash-wave'), highlight: cssColor('--galash-link') }),
        depthTest: false, depthWrite: false
      }));
      this.scene.add(this.mesh);
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.surface.nativeElement);
      this.resize();
      // Prepare the shader before the first visible draw instead of compiling on that frame.
      await this.renderer.compileAsync(this.scene, this.camera);
      if (this.destroyed) return;
      this.ready = true;
      this.sync();
    } catch (error: unknown) {
      if (isDevMode()) console.warn('[GALASH] No se pudo iniciar el fondo WebGL.', error);
      // The solid host background remains usable when WebGL is unavailable.
      this.release();
    }
  }

  private resize(): void {
    if (!this.renderer || !this.mesh) return;
    const bounds = this.surface.nativeElement.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    // This soft background does not need retina resolution or a full 4K drawing buffer.
    this.renderer.setPixelRatio(Math.min(1, Math.sqrt(MAX_BACKGROUND_PIXELS / (width * height))));
    this.renderer.setSize(width, height, false);
    this.mesh.material.uniforms['uResolution'].value.set(width, height);
  }
  private draw(): void {
    if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
  }
  private readonly onVisibility = (): void => this.sync();
  private sync(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.previousTime = 0;
    this.frameAccumulator = FRAME_INTERVAL_MS;
    if (this.destroyed || !this.ready || !this.renderer || !this.visible || document.hidden) return;
    // The home background animates automatically while visible, as requested.
    this.frame = requestAnimationFrame(this.animate);
  }
  private readonly animate = (time: number): void => {
    if (this.destroyed) return;
    this.frame = requestAnimationFrame(this.animate);
    const delta = this.previousTime ? Math.min(time - this.previousTime, 100) : 0;
    this.previousTime = time;
    this.elapsed += delta / 1000 * ANIMATION_SPEED;
    this.frameAccumulator += delta;
    if (this.frameAccumulator < FRAME_INTERVAL_MS) return;
    this.frameAccumulator %= FRAME_INTERVAL_MS;
    if (this.mesh) this.mesh.material.uniforms['uTime'].value = this.elapsed;
    this.draw();
  };
  private release(): void {
    this.ready = false;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.mesh?.geometry.dispose();
    this.mesh?.material.dispose();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.renderer = undefined;
  }
  ngOnDestroy(): void {
    this.destroyed = true;
    this.intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.release();
  }
}
