import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewStatus, SeedbedReviewsService } from '../../seedbeds/reviews/seedbed-reviews.service';

@Component({
  selector: 'app-reviews-admin', standalone: true, imports: [DatePipe],
  templateUrl: './reviews-admin.component.html',
  styleUrls: ['../../seedbeds/reviews/reviews.css', './reviews-admin.component.css']
})
export class ReviewsAdminComponent implements OnInit {
  readonly store = inject(SeedbedReviewsService);
  readonly auth = inject(AuthService);
  readonly filter = signal<ReviewStatus | 'todas'>('todas');
  readonly filters: { value: ReviewStatus | 'todas'; label: string }[] = [
    { value: 'todas', label: 'Todas' }, { value: 'pendiente', label: 'Pendientes' },
    { value: 'publicada', label: 'Publicadas' }, { value: 'oculta', label: 'Ocultas' }, { value: 'rechazada', label: 'Rechazadas' }
  ];
  readonly labels: Record<ReviewStatus, string> = { pendiente: 'Pendiente', publicada: 'Publicada', oculta: 'Oculta', rechazada: 'Rechazada' };
  readonly visible = computed(() => this.store.reviews().filter(review => this.filter() === 'todas' || review.status === this.filter()));
  readonly loading = signal(false);
  readonly busyId = signal('');
  readonly feedback = signal('');
  readonly error = signal('');
  ngOnInit(): void { void this.load(); }
  async load(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try { await this.store.load(); } catch (error: unknown) { this.error.set(this.message(error, 'No pudimos cargar las reseñas.')); }
    finally { this.loading.set(false); }
  }
  async moderate(id: string, status: Exclude<ReviewStatus, 'pendiente'>): Promise<void> {
    if (!this.auth.isAdmin() || this.busyId()) return;
    this.busyId.set(id); this.feedback.set(''); this.error.set('');
    try { await this.store.moderate(id, status); this.feedback.set(`Reseña ${this.labels[status].toLowerCase()}.`); }
    catch (error: unknown) { this.error.set(this.message(error, 'No se pudo moderar la reseña.')); }
    finally { this.busyId.set(''); }
  }
  private message(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    return error.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.' : error.status === 403 ? 'Solo un administrador puede moderar reseñas.' : error.status === 404 ? 'La reseña ya no existe.' : fallback;
  }
}
