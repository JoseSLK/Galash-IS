import { Component, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KnowledgeGraphComponent, KnowledgeGraphData } from '../../shared/components/knowledge-graph/knowledge-graph.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { PublicEvent, Project, Seedbed, SeedbedMember, SeedbedSpace, SeedbedsService, seedbedAbbreviation } from './seedbeds.service';

type ProjectFilter = 'Todos' | Project['status'];

@Component({
  selector: 'app-seedbeds',
  standalone: true,
  imports: [RouterLink, DatePipe, DashboardComponent, SiteFooterComponent, KnowledgeGraphComponent],
  templateUrl: './seedbeds.component.html',
  styleUrl: './seedbeds.component.css'
})
export class SeedbedsComponent {
  private readonly service = inject(SeedbedsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  private loadId = 0;

  readonly state = signal<'loading' | 'ready' | 'empty' | 'error'>('loading');
  readonly seedbeds = signal<Seedbed[]>([]);
  readonly selected = signal<Seedbed | null>(null);
  readonly space = signal<SeedbedSpace | null>(null);
  readonly members = signal<SeedbedMember[]>([]);
  readonly events = signal<PublicEvent[]>([]);
  readonly eventsState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly projects = signal<Project[]>([]);
  readonly knowledgeGraph = computed<KnowledgeGraphData | null>(() => {
    const seedbed = this.selected();
    return seedbed?.topics?.length ? { name: seedbed.name, abbreviation: seedbedAbbreviation(seedbed.name), nodes: seedbed.topics } : null;
  });

  readonly statuses: ProjectFilter[] = ['Todos', 'Activo', 'Finalizado', 'Radicado'];
  readonly filterLabels: Record<ProjectFilter, string> = { Todos: 'Todos', Activo: 'Activos', Finalizado: 'Finalizados', Radicado: 'Radicados' };
  selectedStatus: ProjectFilter = 'Activo';
  readonly eventOrders = ['Más recientes', 'Más antiguos'];
  selectedEventOrder = 'Más recientes';
  selectedDetail: { title: string; description: string; kind: string; metadata: string; event?: PublicEvent } | null = null;
  memberOffset = 0;

  get coordinator(): string {
    const responsible = this.space()?.responsible;
    return [responsible?.name, responsible?.lastName].filter(Boolean).join(' ') || 'Coordinación no disponible';
  }
  get teamLink(): string {
    return this.router.createUrlTree([], { relativeTo: this.route, queryParamsHandling: 'preserve', fragment: 'equipo' }).toString();
  }
  scrollToTeam(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    document.getElementById('equipo')?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }
  constructor() {
    void this.loadEvents();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => void this.load(params.get('id')));
  }
  async loadEvents(): Promise<void> {
    this.eventsState.set('loading');
    try {
      this.events.set(await this.service.publishedEvents());
      this.eventsState.set('ready');
    } catch { this.eventsState.set('error'); }
  }
  selectSeedbed(seedbed: Seedbed): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { id: seedbed.id }, queryParamsHandling: 'merge' });
  }
  private async load(id: string | null): Promise<void> {
    const request = ++this.loadId;
    this.state.set('loading');
    try {
      if (!this.seedbeds().length) this.seedbeds.set(await this.service.list());
      const seedbed = this.seedbeds().find(item => item.id === id) ?? this.seedbeds()[0];
      if (!seedbed) {
        if (request === this.loadId) this.state.set('empty');
        return;
      }
      const [space, members, projects] = await Promise.all([
        this.service.space(seedbed.id),
        this.service.members(seedbed.id),
        this.service.projects(seedbed.id)
      ]);
      if (request !== this.loadId) return;
      this.selected.set(seedbed);
      this.space.set(space);
      this.members.set(members);
      this.projects.set(projects);
      this.memberOffset = 0;
      this.selectedStatus = 'Activo';
      this.selectedEventOrder = 'Más recientes';
      this.selectedDetail = null;
      this.state.set('ready');
    } catch {
      if (request === this.loadId) this.state.set('error');
    }
  }
  retry(): void { void this.load(this.route.snapshot.queryParamMap.get('id')); }
  projectCount(status: ProjectFilter): number { return this.projects().filter(project => status === 'Todos' || project.status === status).length; }
  get filteredProjects(): Project[] { return this.projects().filter(project => this.selectedStatus === 'Todos' || project.status === this.selectedStatus); }
  get filteredEvents(): PublicEvent[] {
    const direction = this.selectedEventOrder === 'Más recientes' ? -1 : 1;
    return [...this.events()].sort((first, second) => direction * (Date.parse(first.startAt) - Date.parse(second.startAt)));
  }
  eventMetadata(event: PublicEvent): string {
    return [formatDate(event.startAt, 'dd/MM/yyyy, HH:mm', this.locale), event.type, event.venue, event.organizerName].filter(Boolean).join(' · ');
  }
  openEventDetails(dialog: HTMLDialogElement, event: PublicEvent): void {
    this.selectedDetail = { title: event.title, description: event.description, kind: 'Evento', metadata: this.eventMetadata(event), event };
    dialog.showModal();
  }
  safeEventLink(value: string | undefined): string | null {
    if (!value) return null;
    try { return ['https:', 'http:'].includes(new URL(value).protocol) ? value : null; }
    catch { return null; }
  }
  memberName(member: SeedbedMember): string { return [member.name, member.lastName].filter(Boolean).join(' '); }
  memberInitials(member: SeedbedMember): string { return this.memberName(member).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
  memberRole(member: SeedbedMember): string {
    const role = member.role.toLowerCase();
    return role === 'docente' || role === 'profesor' ? 'Profesor' : role === 'estudiante' ? 'Estudiante' : member.role;
  }
  projectStatusLabel(status: Project['status']): string {
    return status === 'Activo' ? 'Activa' : status === 'Finalizado' ? 'Finalizada' : 'Radicada';
  }
  openDetails(dialog: HTMLDialogElement, item: { title: string; description: string }, kind: string, metadata: string): void {
    this.selectedDetail = { ...item, kind, metadata };
    dialog.showModal();
  }
  get visibleMembers(): SeedbedMember[] {
    const members = this.members();
    return Array.from({ length: Math.min(4, members.length) }, (_, index) => members[(this.memberOffset + index) % members.length]);
  }
  moveMembers(direction: number): void { this.memberOffset = (this.memberOffset + direction + this.members().length) % this.members().length; }
}
