import { Component, Input, OnChanges, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SeedbedReview, SeedbedReviewsService } from './seedbed-reviews.service';

@Component({
  selector: 'app-seedbed-reviews', standalone: true, imports: [DatePipe, FormsModule],
  templateUrl: './seedbed-reviews.component.html', styleUrl: './reviews.css'
})
export class SeedbedReviewsComponent implements OnChanges {
  @Input({ required: true }) seedbedId = '';
  readonly store = inject(SeedbedReviewsService);
  readonly auth = inject(AuthService);
  readonly published = signal<SeedbedReview[]>([]);
  readonly loadError = signal(false);
  readonly columns = computed(() => {
    const reviews = this.published();
    return [0, 1, 2].map(offset => reviews.length ? Array.from({ length: Math.max(3, reviews.length) }, (_, index) => reviews[(index + offset) % reviews.length]) : []);
  });
  text = '';
  feedback = '';
  sending = false;
  ngOnChanges(): void {
    this.text = ''; this.feedback = ''; this.published.set([]); this.loadError.set(false);
    const id = this.seedbedId;
    this.store.published(id)
      .then(items => { if (id === this.seedbedId) this.published.set(items); })
      .catch(() => { if (id === this.seedbedId) this.loadError.set(true); });
  }
  initials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
  async submit(): Promise<void> {
    if (this.sending || !this.auth.isAuthenticated() || !this.text.trim() || this.text.trim().length > 2000) return;
    this.sending = true;
    try {
      await this.store.submit(this.seedbedId, this.text);
      this.text = '';
      this.feedback = 'Reseña enviada a revisión. Será visible cuando un administrador la acepte.';
    } catch (error: unknown) {
      this.feedback = error instanceof HttpErrorResponse
        ? error.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
          : error.status === 403 ? 'Tu cuenta aún no puede enviar reseñas. Debes ser integrante, docente o administrador.'
          : 'No se pudo enviar la reseña. Inténtalo de nuevo.'
        : error instanceof Error ? error.message : 'No se pudo enviar la reseña.';
    } finally { this.sending = false; }
  }
}
