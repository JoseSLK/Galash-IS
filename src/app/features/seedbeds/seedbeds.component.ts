import {ProjectsService} from '../projects/projects.service';
import {ResearchProject} from '../projects/project.model';
import { SeedbedReviewsComponent } from './reviews/seedbed-reviews.component';
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
  imports: [SeedbedReviewsComponent, RouterLink, DatePipe, DashboardComponent, SiteFooterComponent, KnowledgeGraphComponent],
  templateUrl: './seedbeds.component.html',
  styleUrl: './seedbeds.component.css'
})
export class SeedbedsComponent {
  readonly abbreviation = seedbedAbbreviation;
  private readonly service = inject(SeedbedsService);
  private readonly projectCatalog=inject(ProjectsService);
  readonly localProjects=signal<ResearchProject[]>([]);
  readonly seedbedProjects=computed(()=>{const seedbed=this.selected();if(!seedbed)return [];const name=seedbed.name.trim().toLowerCase();const abbreviation=seedbedAbbreviation(seedbed.name).toLowerCase();return this.localProjects().filter(project=>[name,abbreviation].includes(project.seedbed.trim().toLowerCase()));});
  get allProjects():Project[] {const local=this.seedbedProjects();return [...local,...this.projects().filter(project=>!local.some(item=>item.id===project.id))];}
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  private loadId = 0;

  readonly state = signal<'loading' | 'ready' | 'empty' | 'error'>('loading');
  readonly seedbeds = signal<Seedbed[]>([]);
  readonly selected = signal<Seedbed | null>(null);
  readonly selectedIndex = computed(() => Math.max(0, this.seedbeds().findIndex(seedbed => seedbed.id === this.selected()?.id)));
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
  selectedDetail: { title: string; description: string; kind: string; metadata: string; event?: PublicEvent; project?:ResearchProject } | null = null;
  memberOffset = 0;

  get coordinator(): string {
    const responsible = this.space()?.responsible;
    return [responsible?.name, responsible?.lastName].filter(Boolean).join(' ') || 'Coordinación no disponible';
  }
  get directorySeedbed(): string { return this.selected()?.name ?? ''; }
  constructor() {
    this.projectCatalog.list().pipe(takeUntilDestroyed()).subscribe(projects=>this.localProjects.set(projects));
    void this.loadEvents();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => void this.load(params.get('id') ?? params.get('nombre')));
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
  navigateSeedbeds(event: KeyboardEvent, index: number): void {
    const count = this.seedbeds().length;
    if (!count) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % count; break;
      case 'ArrowLeft': next = (index - 1 + count) % count; break;
      case 'Home': next = 0; break;
      case 'End': next = count - 1; break;
      default: return;
    }
    event.preventDefault();
    this.selectSeedbed(this.seedbeds()[next]);
    (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }
  private async load(id: string | null): Promise<void> {
    const request = ++this.loadId;
    this.state.set('loading');
    try {
      if (!this.seedbeds().length) this.seedbeds.set(await this.service.list());
      const seedbed = this.seedbeds().find(item => item.id === id || (!!id && (item.name.toLocaleLowerCase() === id.toLocaleLowerCase() || seedbedAbbreviation(item.name).toLocaleLowerCase() === id.toLocaleLowerCase()))) ?? this.seedbeds()[0];
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
  retry(): void { void this.load(this.route.snapshot.queryParamMap.get('id') ?? this.route.snapshot.queryParamMap.get('nombre')); }
  projectCount(status: ProjectFilter): number { return this.allProjects.filter(project => status === 'Todos' || project.status === status).length; }
  get filteredProjects(): Project[] { return this.allProjects.filter(project => this.selectedStatus === 'Todos' || project.status === this.selectedStatus); }
  get filteredEvents(): PublicEvent[] {
    const direction = this.selectedEventOrder === 'Más recientes' ? -1 : 1;
    return [...this.events()].sort((first, second) => direction * (Date.parse(first.startAt) - Date.parse(second.startAt)));
  }
  eventMetadata(event: PublicEvent): string {
    return [formatDate(event.startAt, 'dd/MM/yyyy, HH:mm', this.locale), event.type, event.venue, event.organizerName].filter(Boolean).join(' · ');
  }
  openProjectDetails(dialog:HTMLDialogElement,project:Project):void {this.selectedDetail={title:project.title,description:project.summary,kind:'Proyecto',metadata:this.projectStatusLabel(project.status),project:this.localProjects().find(item=>item.id===project.id)};dialog.showModal();}
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
    return status;
  }
  openDetails(dialog: HTMLDialogElement, item: { title: string; description: string }, kind: string, metadata: string): void {
    this.selectedDetail = { ...item, kind, metadata };
    dialog.showModal();
  }
  get visibleMembers(): SeedbedMember[] {
    const members = this.members();
    return Array.from({ length: Math.min(4, members.length) }, (_, index) => members[(this.memberOffset + index) % members.length]);
  }
  moveMembers(direction: number): void {
    const count = this.members().length;
    if (count <= 1) return;
    this.memberOffset = (this.memberOffset + direction + count) % count;
  }
}
