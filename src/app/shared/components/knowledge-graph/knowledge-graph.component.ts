import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, ViewChild, inject } from '@angular/core';
import { forceCollide, forceManyBody, forceSimulation, forceX, forceY, Simulation, SimulationNodeDatum } from 'd3-force';

export interface KnowledgeGraphData {
  name: string;
  abbreviation: string;
  nodes: { title: string; phrase: string }[];
}
interface GraphNode extends SimulationNodeDatum {
  id: number;
  title: string;
  phrase: string;
  central: boolean;
  homeX: number;
  homeY: number;
  radius: number;
}

@Component({
  selector: 'app-knowledge-graph',
  standalone: true,
  templateUrl: './knowledge-graph.component.html',
  styleUrl: './knowledge-graph.component.css'
})
export class KnowledgeGraphComponent implements AfterViewInit, OnChanges, OnDestroy {
  private static nextId = 0;
  readonly tooltipId = `knowledge-graph-tooltip-${KnowledgeGraphComponent.nextId++}`;
  @Input({ required: true }) data!: KnowledgeGraphData;
  @ViewChild('container', { static: true }) private container!: ElementRef<HTMLElement>;
  private readonly zone = inject(NgZone);
  private readonly detector = inject(ChangeDetectorRef);
  private simulation?: Simulation<GraphNode, undefined>;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private motion?: MediaQueryList;
  private transitionTimer?: ReturnType<typeof setTimeout>;
  private animationFrame = 0;
  private initialized = false;
  private destroyed = false;
  private visible = false;
  private dragged?: GraphNode;
  private pointerId?: number;
  private dragTarget?: SVGGElement;
  private pointerStart?: { x: number; y: number };
  private moved = false;
  private suppressClick = false;
  private phaseTime = 0;
  width = 440;
  readonly height = 360;
  nodes: GraphNode[] = [];
  graphName = '';
  abbreviation = '';
  phase: 'visible' | 'enter' | 'exit' = 'visible';
  hovered: number | null = null;
  focused: number | null = null;
  pinned: number | null = null;
  reducedMotion = false;
  arriving = false;

  get titles(): string { return this.satellites.map(node => node.title).join(', '); }
  get cx(): number { return this.width / 2; }
  get cy(): number { return this.height / 2; }
  get compact(): boolean { return window.innerWidth <= 480; }
  get centralNode(): GraphNode | undefined { return this.nodes[0]; }
  get centerX(): number { return this.centralNode?.x ?? this.cx; }
  get centerY(): number { return this.centralNode?.y ?? this.cy; }
  get satellites(): GraphNode[] { return this.nodes.filter(node => !node.central); }
  get activeId(): number | null { return this.pinned ?? this.focused ?? this.hovered; }
  get activeNode(): GraphNode | undefined { return this.satellites.find(node => node.id === this.activeId); }
  get orbitRadius(): number { return Math.min(142, this.width / 2 - 30); }
  get tooltipLeft(): number {
    const node = this.activeNode;
    return Math.max(8, Math.min(this.width - this.tooltipWidth - 8, (node?.x ?? this.cx) - this.tooltipWidth / 2));
  }
  get tooltipWidth(): number { return Math.min(210, this.width - 16); }
  get tooltipTop(): number {
    const y = this.activeNode?.y ?? this.cy;
    return y > this.cy ? Math.max(8, y - 112) : Math.min(this.height - 104, y + 42);
  }

  ngOnChanges(): void {
    if (!this.initialized) return;
    clearTimeout(this.transitionTimer);
    cancelAnimationFrame(this.animationFrame);
    this.releasePointer();
    this.pinned = this.focused = this.hovered = null;
    this.simulation?.stop();
    if (this.reducedMotion || !this.visible || document.hidden) {
      this.phase = 'visible';
      this.arriving = false;
      this.createGraph();
      return;
    }
    this.phase = 'exit';
    this.transitionTimer = setTimeout(() => {
      if (this.destroyed) return;
      this.phase = 'enter';
      this.arriving = true;
      this.createGraph();
      this.detector.detectChanges();
      this.animationFrame = requestAnimationFrame(() => {
        this.animationFrame = requestAnimationFrame(() => {
          if (this.destroyed) return;
          this.phase = 'visible';
          this.detector.detectChanges();
          this.updateRunning();
          this.transitionTimer = setTimeout(() => {
            this.arriving = false;
            if (!this.destroyed) this.detector.detectChanges();
          }, 400);
        });
      });
    }, 400);
  }

  ngAfterViewInit(): void {
    this.initialized = true;
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motion.matches;
    this.width = Math.max(240, this.container.nativeElement.clientWidth);
    this.createGraph();
    this.motion.addEventListener('change', this.onMotionChange);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.resizeObserver = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (width < 240) return;
      if (Math.abs(width - this.width) < 1) return;
      this.width = width;
      this.releasePointer();
      this.createGraph();
      this.detector.detectChanges();
    });
    this.resizeObserver.observe(this.container.nativeElement);
    this.intersectionObserver = new IntersectionObserver(entries => {
      this.visible = entries[0].isIntersecting;
      this.updateRunning();
    });
    this.intersectionObserver.observe(this.container.nativeElement);
    this.detector.detectChanges();
  }

  private createGraph(): void {
    this.simulation?.stop();
    this.graphName = this.data.name;
    this.abbreviation = this.data.abbreviation;
    const radius = Math.min(116, this.width / 2 - 40);
    this.nodes = [{ id: -1, title: this.abbreviation, phrase: '', central: true, homeX: this.cx, homeY: this.cy, x: this.cx, y: this.cy, radius: 48 },
      ...this.data.nodes.map((node, index) => {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / this.data.nodes.length;
        const x = this.cx + Math.cos(angle) * radius;
        const y = this.cy + Math.sin(angle) * radius;
        return { ...node, id: index, central: false, homeX: x, homeY: y, x, y, radius: 10 + index % 3 * 2 };
      })];
    this.zone.runOutsideAngular(() => {
      this.simulation = forceSimulation(this.nodes)
        .force('charge', forceManyBody<GraphNode>().strength(node => node.central ? -220 : -90))
        .force('collision', forceCollide<GraphNode>().radius(node => node.central ? 65 : 30).iterations(3))
        .force('x', forceX<GraphNode>(node => node.homeX).strength(.065))
        .force('y', forceY<GraphNode>(node => node.homeY).strength(.065))
        .velocityDecay(.65).stop();
      this.simulation.tick(90);
      this.constrain();
      this.simulation.on('tick', () => {
        this.phaseTime += .009;
        if (!this.reducedMotion) {
          this.simulation?.force('x', forceX<GraphNode>(node => node.homeX + (node.central ? 0 : Math.sin(this.phaseTime + node.id * 1.8) * 10)).strength(.065));
          this.simulation?.force('y', forceY<GraphNode>(node => node.homeY + (node.central ? 0 : Math.cos(this.phaseTime * .7 + node.id) * 9)).strength(.065));
        }
        this.constrain();
        if (!this.destroyed) this.detector.detectChanges();
      });
      this.updateRunning();
    });
  }

  private constrain(): void {
    for (const node of this.satellites) {
      let x = node.x ?? node.homeX;
      let y = node.y ?? node.homeY;
      const dx = x - this.centerX, dy = y - this.centerY;
      const distance = Math.hypot(dx, dy);
      if (distance < 86) {
        const angle = distance < 1 ? Math.atan2(node.homeY - this.cy, node.homeX - this.cx) : Math.atan2(dy, dx);
        x = this.centerX + Math.cos(angle) * 86;
        y = this.centerY + Math.sin(angle) * 86;
      }
      const margin = this.compact ? Math.max(24, node.title.length * 3.5 + 8) : Math.max(40, node.title.length * 7.5 + 24);
      node.x = Math.max(margin, Math.min(this.width - margin, x));
      node.y = Math.max(30, Math.min(this.height - 48, y));
    }
  }

  private updateRunning(): void {
    const measuredWidth = this.container.nativeElement.clientWidth;
    if (this.visible && measuredWidth >= 240 && Math.abs(measuredWidth - this.width) > 1) {
      this.width = measuredWidth;
      this.createGraph();
      return;
    }
    const run = this.visible && !document.hidden && this.phase === 'visible';
    if (!run || (this.reducedMotion && !this.dragged)) { this.simulation?.stop(); return; }
    this.zone.runOutsideAngular(() => this.simulation?.alphaTarget(this.reducedMotion ? 0 : .18).alpha(.3).restart());
  }
  private readonly onVisibilityChange = (): void => this.updateRunning();
  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    this.reducedMotion = event.matches;
    this.arriving = false;
    clearTimeout(this.transitionTimer);
    this.phase = 'visible';
    this.createGraph();
    this.detector.detectChanges();
  };

  position(node: GraphNode): string {
    return this.phase === 'enter' ? `translate(${this.cx}px, ${this.cy}px)` : `translate(${node.x}px, ${node.y}px)`;
  }
  toggle(node: GraphNode): void {
    if (this.suppressClick) { this.suppressClick = false; return; }
    this.pinned = this.pinned === node.id ? null : node.id;
    if (this.pinned === null) this.focused = this.hovered = null;
  }
  keydown(event: KeyboardEvent, node: GraphNode): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.toggle(node); }
    if (event.key === 'Escape') { this.pinned = this.focused = this.hovered = null; event.stopPropagation(); }
  }
  pointerDown(event: PointerEvent, node: GraphNode): void {
    if (!event.isPrimary || event.button !== 0) return;
    this.dragged = node;
    this.pointerId = event.pointerId;
    this.dragTarget = event.currentTarget as SVGGElement;
    this.pointerStart = { x: event.clientX, y: event.clientY };
    this.moved = false;
    this.dragTarget.setPointerCapture(event.pointerId);
  }
  pointerMove(event: PointerEvent): void {
    if (!this.dragged || event.pointerId !== this.pointerId || !this.pointerStart) return;
    if (!this.moved && Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) < 5) return;
    this.moved = true;
    const rect = this.container.nativeElement.getBoundingClientRect();
    const margin = this.dragged.central ? 100 : 24;
    this.dragged.fx = Math.max(margin, Math.min(this.width - margin, (event.clientX - rect.left) * this.width / rect.width));
    this.dragged.fy = Math.max(this.dragged.central ? 100 : 30, Math.min(this.height - (this.dragged.central ? 100 : 48), (event.clientY - rect.top) * this.height / rect.height));
    this.updateRunning();
  }
  pointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.suppressClick = this.moved;
    this.releasePointer();
    if (this.reducedMotion) {
      this.simulation?.alpha(1).tick(90);
      this.constrain();
    }
    this.updateRunning();
  }
  private releasePointer(): void {
    if (this.dragged) { this.dragged.fx = null; this.dragged.fy = null; }
    if (this.pointerId !== undefined && this.dragTarget?.hasPointerCapture(this.pointerId)) this.dragTarget.releasePointerCapture(this.pointerId);
    this.dragged = undefined;
    this.pointerId = undefined;
    this.dragTarget = undefined;
    this.pointerStart = undefined;
  }
  ngOnDestroy(): void {
    this.destroyed = true;
    this.releasePointer();
    this.simulation?.on('tick', null).stop();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.motion?.removeEventListener('change', this.onMotionChange);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    clearTimeout(this.transitionTimer);
    cancelAnimationFrame(this.animationFrame);
  }
}
