import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject, isDevMode } from '@angular/core';
import type { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderer } from 'three';

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 field(vec2 uv) {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = uTime;
  vec3 color = vec3(0.018, 0.035, 0.075);
  float drift = sin(p.x * 2.3 + t * 0.24) * 0.045 + cos(p.x * 4.1 - t * 0.17) * 0.025;
  float ribbon = exp(-abs(p.y + 0.30 + drift) * 24.0);
  float broad = exp(-abs(p.y + 0.30 + drift) * 6.0);
  float center = exp(-p.x * p.x * 1.9);
  vec3 neon = mix(vec3(0.19, 0.85, 0.66), vec3(0.58, 0.20, 0.94), sin(p.x * 2.0 + t * 0.13) * 0.5 + 0.5);
  color += neon * (ribbon * 0.47 + broad * 0.16) * (0.4 + center * 0.6);
  color += vec3(0.22, 0.08, 0.45) * exp(-length((p - vec2(0.28 * sin(t * 0.1), -0.40)) * vec2(1.1, 2.8)) * 2.3) * 0.55;

  float depth = max(0.045, 0.47 - uv.y);
  vec2 world = vec2((uv.x - 0.5) * aspect / depth, 1.0 / depth + t * 0.16);
  vec2 cell = abs(fract(world * 1.4) - 0.5);
  float lines = max(1.0 - smoothstep(0.0, 0.018, cell.x), 1.0 - smoothstep(0.0, 0.025, cell.y));
  float floorMask = (1.0 - smoothstep(0.18, 0.45, uv.y)) * smoothstep(0.0, 0.10, uv.y);
  color += neon * lines * floorMask * 0.20;

  vec2 stars = uv * vec2(85.0, 46.0);
  vec2 starCell = floor(stars);
  float star = (1.0 - smoothstep(0.015, 0.08, length(fract(stars) - 0.5))) * step(0.982, hash(starCell));
  color += vec3(0.55, 0.75, 0.92) * star * (0.35 + sin(t * 0.3 + hash(starCell) * 6.28) * 0.15);
  return color;
}

void main() {
  vec2 uv = vUv;
  float tick = floor(uTime * 5.0);
  float glitch = step(0.975, hash(vec2(tick, 7.0)));
  float row = floor(uv.y * 45.0);
  uv.x += (hash(vec2(row, tick)) - 0.5) * 0.065 * glitch;
  float shift = 0.0015 + glitch * 0.006;
  vec3 color = vec3(field(uv + vec2(shift, 0.0)).r, field(uv).g, field(uv - vec2(shift, 0.0)).b);
  float grain = hash(gl_FragCoord.xy + floor(uTime * 12.0)) - 0.5;
  color += grain * 0.024;
  float scan = sin(gl_FragCoord.y * 1.7) * 0.005;
  color += scan;
  color *= 0.85 + 0.15 * smoothstep(0.0, 0.45, min(vUv.x, 1.0 - vUv.x));
  gl_FragColor = vec4(max(color, 0.0), 1.0);
}`;

@Component({
  selector: 'app-glitch-background',
  standalone: true,
  template: `<canvas #surface aria-hidden="true"></canvas>`,
  styles: `:host{position:absolute;inset:0;display:block;overflow:hidden;pointer-events:none;background:#0a1420}canvas{display:block;width:100%;height:100%}`
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

  ngAfterViewInit(): void {
    document.addEventListener('visibilitychange', this.onVisibility);
    this.zone.runOutsideAngular(() => {
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
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      this.scene = new Scene();
      this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.mesh = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
        uniforms: { uTime: { value: this.elapsed }, uResolution: { value: new Vector2(1, 1) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader, depthTest: false, depthWrite: false
      }));
      this.scene.add(this.mesh);
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.surface.nativeElement);
      this.resize();
      this.sync();
    } catch (error: unknown) {
      if (isDevMode()) console.warn('[GALASH] No se pudo iniciar el fondo WebGL.', error);
      // The solid host background remains usable when WebGL is unavailable.
      this.release();
    }
  }

  private resize(): void {
    if (!this.renderer || !this.mesh) return;
    const { width, height } = this.surface.nativeElement.getBoundingClientRect();
    this.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    this.mesh.material.uniforms['uResolution'].value.set(Math.max(1, width), Math.max(1, height));
    this.draw();
  }
  private draw(): void {
    if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
  }
  private readonly onVisibility = (): void => this.sync();
  private sync(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.previousTime = 0;
    if (this.destroyed || !this.renderer || !this.visible || document.hidden) return;
    this.frame = requestAnimationFrame(this.animate);
  }
  private readonly animate = (time: number): void => {
    if (this.destroyed) return;
    this.frame = requestAnimationFrame(this.animate);
    if (this.previousTime && time - this.previousTime < 1000 / 30) return;
    if (this.previousTime) this.elapsed += Math.min((time - this.previousTime) / 1000, 0.1);
    this.previousTime = time;
    if (this.mesh) this.mesh.material.uniforms['uTime'].value = this.elapsed;
    this.draw();
  };
  private release(): void {
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
