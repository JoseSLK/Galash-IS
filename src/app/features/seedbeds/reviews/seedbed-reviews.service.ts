import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { SeedbedsService } from '../seedbeds.service';

export type ReviewStatus = 'pendiente' | 'publicada' | 'oculta' | 'rechazada';
export const REVIEW_STATUSES: ReviewStatus[] = ['pendiente', 'publicada', 'oculta', 'rechazada'];
interface ReviewApi { id: string; seedbedId: string; authorId: string; text: string; status: ReviewStatus; createdAt: string | null; }
// View model: the API sends ids only, names are resolved for display.
export interface SeedbedReview {
  id: string; seedbedId: string; seedbedName: string; author: string;
  date: string; text: string; status: ReviewStatus;
}
@Injectable({ providedIn: 'root' })
export class SeedbedReviewsService {
  private readonly api = inject(ApiService);
  private readonly seedbeds = inject(SeedbedsService);
  readonly reviews = signal<SeedbedReview[]>([]);
  readonly pendingCount = computed(() => this.reviews().filter(review => review.status === 'pendiente').length);

  async published(seedbedId: string): Promise<SeedbedReview[]> {
    const { reviews } = await this.api.get<{ reviews: { id: string; seedbedId: string; authorName: string; text: string; createdAt: string }[] | null }>(`/seedbeds/${encodeURIComponent(seedbedId)}/reviews`);
    return (reviews ?? []).map(item => ({ id: item.id, seedbedId: item.seedbedId, seedbedName: '', author: item.authorName || 'Integrante', date: item.createdAt, text: item.text, status: 'publicada' }));
  }

  async submit(seedbedId: string, text: string): Promise<void> {
    const clean = text.trim();
    if (!clean || clean.length > 2000) throw new Error('Escribe entre 1 y 2000 caracteres.');
    await this.api.post(`/seedbeds/${encodeURIComponent(seedbedId)}/reviews`, { text: clean });
  }

  // The backend filters by one status per call (default pendiente), so all states take one call each.
  async load(): Promise<void> {
    const [lists, seedbeds] = await Promise.all([
      Promise.all(REVIEW_STATUSES.map(status => this.api.get<{ reviews: ReviewApi[] | null }>(`/admin/seedbed-reviews?status=${status}`))),
      this.seedbeds.list()
    ]);
    const items = lists.flatMap(list => list.reviews ?? []);
    const names = new Map(await Promise.all([...new Set(items.map(item => item.authorId))].map(async id => [id, await this.authorName(id)] as const)));
    const seedbedNames = new Map(seedbeds.map(seedbed => [seedbed.id, seedbed.name]));
    this.reviews.set(items.map(item => ({
      id: item.id, seedbedId: item.seedbedId, seedbedName: seedbedNames.get(item.seedbedId) ?? 'Semillero',
      author: names.get(item.authorId) ?? 'Integrante', date: item.createdAt ?? '', text: item.text, status: item.status
    })).sort((a, b) => b.date.localeCompare(a.date)));
  }

  async moderate(id: string, status: Exclude<ReviewStatus, 'pendiente'>): Promise<void> {
    const updated = await this.api.patch<ReviewApi, { status: string; note: string }>(`/admin/seedbed-reviews/${encodeURIComponent(id)}/moderation`, { status, note: '' });
    this.reviews.update(reviews => reviews.map(review => review.id === id ? { ...review, status: updated.status } : review));
  }

  private async authorName(id: string): Promise<string> {
    try {
      const profile = await this.api.get<{ name?: string; last_name?: string }>(`/members/${encodeURIComponent(id)}`);
      return [profile.name, profile.last_name].filter(Boolean).join(' ') || 'Integrante';
    } catch { return 'Integrante'; }
  }
}
