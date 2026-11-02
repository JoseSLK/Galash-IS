import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewStatus, SeedbedReviewsService } from '../../seedbeds/reviews/seedbed-reviews.service';

@Component({
  selector: 'app-reviews-admin', standalone: true, imports: [DatePipe],
  templateUrl: './reviews-admin.component.html',
  styleUrls: ['../../seedbeds/reviews/reviews.css', './reviews-admin.component.css']
})
export class ReviewsAdminComponent {
  readonly store = inject(SeedbedReviewsService);
  readonly auth = inject(AuthService);
  readonly filter = signal<ReviewStatus | 'todas'>('todas');
  readonly filters: { value: ReviewStatus | 'todas'; label: string }[] = [
    { value: 'todas', label: 'Todas' }, { value: 'pendiente', label: 'Pendientes' },
    { value: 'publicada', label: 'Publicadas' }, { value: 'oculta', label: 'Ocultas' }, { value: 'rechazada', label: 'Rechazadas' }
  ];
  readonly labels: Record<ReviewStatus, string> = { pendiente: 'Pendiente', publicada: 'Publicada', oculta: 'Oculta', rechazada: 'Rechazada' };
  readonly visible = computed(() => this.store.reviews().filter(review => this.filter() === 'todas' || review.status === this.filter()));
  readonly feedback = signal('');
  moderate(id: string, status: Exclude<ReviewStatus, 'pendiente'>): void {
    if (!this.auth.isAdmin()) return;
    this.store.moderate(id, status);
    this.feedback.set(`Reseña ${this.labels[status].toLowerCase()} en esta demostración.`);
  }
}
