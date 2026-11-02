import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PublicEvent } from '../seedbeds/seedbeds.service';

export function eventUrl(value?: string): string | null {
  if (!value) return null;
  try { return ['https:', 'http:'].includes(new URL(value).protocol) ? value : null; }
  catch { return null; }
}
@Component({
  selector: 'app-event-card', standalone: true, imports: [DatePipe],
  template: `
    <article [class.featured]="featured">
      <div class="visual">
        @if (image && !imageFailed) {<img [src]="image" [alt]="event.title" loading="lazy" (error)="imageFailed = true" />}
        @else {<div class="placeholder" aria-hidden="true"><svg viewBox="0 0 48 48"><rect x="8" y="11" width="32" height="30" rx="4"/><path d="M8 21h32M16 6v10M32 6v10M16 28h4M27 28h4M16 34h4"/></svg></div>}
      </div>
      <div class="body">
        <div class="date"><strong>{{ event.startAt | date:'d' }}</strong><span>{{ event.startAt | date:'MM/yyyy' }}</span></div>
        <div class="copy">
          <div class="meta">@if (featured) {<span class="tag">SIGUIENTE EVENTO</span>} {{ event.type }} · {{ event.startAt | date:'HH:mm' }}</div>
          <h2>{{ event.title }}</h2>
          <p>{{ event.venue || (event.meetingUrl ? 'Evento virtual' : 'Lugar por confirmar') }}</p>
          <div class="bottom"><span class="general">General</span><span class="phase">{{ phase }}</span></div>
          <button type="button" (click)="details.emit(event)" [attr.aria-label]="'Ver detalles de ' + event.title">Ver detalles ↗</button>
        </div>
      </div>
    </article>`,
  styleUrl: './event-card.component.css'
})
export class EventCardComponent {
  @Input({ required: true }) event!: PublicEvent;
  @Input() featured = false;
  @Input() now = Date.now();
  @Output() details = new EventEmitter<PublicEvent>();
  imageFailed = false;
  get image(): string | null { return eventUrl(this.event.imageUrl); }
  get phase(): string {
    const start = Date.parse(this.event.startAt);
    if (start >= this.now) {
      if (new Date(start).toDateString() === new Date(this.now).toDateString()) return 'Hoy';
      const days = Math.ceil((start - this.now) / 86_400_000);
      return this.featured ? (days === 1 ? 'Falta 1 día' : `Faltan ${days} días`) : 'Próximo';
    }
    return this.event.endAt && Date.parse(this.event.endAt) >= this.now ? 'En curso' : 'Anterior';
  }
}
