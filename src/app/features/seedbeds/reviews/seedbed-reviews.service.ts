import { Injectable, computed, signal } from '@angular/core';

export type ReviewStatus = 'pendiente' | 'publicada' | 'oculta' | 'rechazada';
// Local view model only. This is not an API payload or shared contract.
export interface SeedbedReview {
  id: string; seedbedId: string; seedbedName: string; author: string;
  date: string; text: string; status: ReviewStatus;
}
@Injectable({ providedIn: 'root' })
export class SeedbedReviewsService {
  readonly reviews = signal<SeedbedReview[]>([
    { id: 'demo-pending', seedbedId: 'demo', seedbedName: 'Semillero de ejemplo', author: 'Participante de ejemplo', date: '2026-09-06T14:00:00Z', text: 'Sería útil compartir las próximas sesiones con más anticipación para preparar nuestras preguntas.', status: 'pendiente' }
  ]);
  readonly pendingCount = computed(() => this.reviews().filter(review => review.status === 'pendiente').length);

  prepare(seedbedId: string, seedbedName: string): void {
    if (this.reviews().some(review => review.seedbedId === seedbedId)) return;
    const examples = [
      ['Ana · ejemplo', 'Un espacio para aprender en equipo. Las sesiones prácticas me ayudaron a convertir una idea en un proyecto de investigación.'],
      ['David · ejemplo', 'Me gustó poder compartir mis preguntas y recibir orientación. Sugiero realizar más encuentros entre semilleros.'],
      ['Camila · ejemplo', 'La colaboración entre estudiantes y docentes hace que cada encuentro sea una oportunidad para explorar algo nuevo.']
    ];
    this.reviews.update(reviews => [...reviews, ...examples.map(([author, text], index): SeedbedReview => ({ id: `demo-${seedbedId}-${index}`, seedbedId, seedbedName, author, text, date: '2026-09-06T14:00:00Z', status: 'publicada' }))]);
  }
  submit(seedbedId: string, seedbedName: string, author: string, text: string): void {
    const clean = text.trim();
    if (!clean || clean.length > 2000) throw new Error('Escribe entre 1 y 2000 caracteres.');
    this.reviews.update(reviews => [{ id: crypto.randomUUID(), seedbedId, seedbedName, author, text: clean, date: new Date().toISOString(), status: 'pendiente' }, ...reviews]);
  }
  moderate(id: string, status: Exclude<ReviewStatus, 'pendiente'>): void {
    this.reviews.update(reviews => reviews.map(review => review.id === id ? { ...review, status } : review));
  }
}
