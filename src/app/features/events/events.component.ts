import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { PublicEvent, SeedbedsService } from '../seedbeds/seedbeds.service';
import { EventCardComponent, eventUrl } from './event-card.component';

type DateFilter = 'next' | 'past' | 'all';
@Component({
  selector: 'app-events', standalone: true,
  imports: [DatePipe, DashboardComponent, SiteFooterComponent, EventCardComponent],
  templateUrl: './events.component.html', styleUrl: './events.component.css'
})
export class EventsComponent {
  private readonly service = inject(SeedbedsService);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly events = signal<PublicEvent[]>([]);
  readonly now = signal(Date.now());
  readonly filter = signal<DateFilter>('next');
  readonly filters = [{ id: 'next', label: 'Próximos' }, { id: 'past', label: 'Anteriores' }, { id: 'all', label: 'Todos' }] as const;
  readonly selected = signal<PublicEvent | null>(null);
  readonly safeUrl = eventUrl;
  readonly filtered = computed(() => this.events().filter(event => this.filter() === 'all' || (Date.parse(event.startAt) >= this.now()) === (this.filter() === 'next')).sort((a, b) => this.filter() === 'past' ? Date.parse(b.startAt) - Date.parse(a.startAt) : Date.parse(a.startAt) - Date.parse(b.startAt)));
  readonly featured = computed(() => this.filtered().find(event => Date.parse(event.startAt) >= this.now()) ?? null);
  readonly cards = computed(() => this.filtered().filter(event => event.id !== this.featured()?.id));
  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    void this.load();
  }
  count(filter: DateFilter): number { return this.events().filter(event => filter === 'all' || (Date.parse(event.startAt) >= this.now()) === (filter === 'next')).length; }
  async load(): Promise<void> {
    this.state.set('loading');
    try { this.events.set(await this.service.publishedEvents()); this.now.set(Date.now()); this.state.set('ready'); }
    catch { this.state.set('error'); }
  }
  showDetails(event: PublicEvent, dialog: HTMLDialogElement): void { this.selected.set(event); dialog.showModal(); }
}
