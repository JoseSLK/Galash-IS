import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';
import { ApiService } from '../../../core/services/api.service';
import { SeedbedsService } from '../seedbeds.service';
import { SeedbedReviewsService } from './seedbed-reviews.service';

const review = { id: 'r1', seedbedId: 's1', authorId: 'u1', text: 'Buen espacio', status: 'pendiente', createdAt: '2026-11-01T10:00:00Z' };
function setup() {
  const api = {
    get: vi.fn(async (path: string) => path.startsWith('/members/') ? { name: 'Ana', last_name: 'Ruiz' } : { reviews: path.endsWith('pendiente') ? [review] : null }),
    post: vi.fn(async () => review),
    patch: vi.fn(async (_path: string, body: { status: string }) => ({ ...review, status: body.status }))
  };
  const store = runInInjectionContext(Injector.create({ providers: [
    { provide: ApiService, useValue: api },
    { provide: SeedbedsService, useValue: { list: async () => [{ id: 's1', name: 'Semillero A' }] } }
  ] }), () => new SeedbedReviewsService());
  return { store, api };
}
describe('seedbed reviews API integration', () => {
  it('posts trimmed text to the seedbed review endpoint', async () => {
    const { store, api } = setup();
    await store.submit('s1', '  Una sugerencia  ');
    expect(api.post).toHaveBeenCalledWith('/seedbeds/s1/reviews', { text: 'Una sugerencia' });
  });
  it('reads published reviews from the public seedbed endpoint', async () => {
    const { store, api } = setup();
    api.get.mockResolvedValueOnce({ reviews: [{ id: 'p1', seedbedId: 's1', authorName: 'Ana Ruiz', text: 'Gran espacio', createdAt: '2026-11-02T10:00:00Z' }] } as never);
    expect(await store.published('s1')).toEqual([{ id: 'p1', seedbedId: 's1', seedbedName: '', author: 'Ana Ruiz', date: '2026-11-02T10:00:00Z', text: 'Gran espacio', status: 'publicada' }]);
    expect(api.get).toHaveBeenCalledWith('/seedbeds/s1/reviews');
  });
  it('rejects empty or overlong text without calling the API', async () => {
    const { store, api } = setup();
    await expect(store.submit('s1', '   ')).rejects.toThrow();
    await expect(store.submit('s1', 'a'.repeat(2001))).rejects.toThrow();
    expect(api.post).not.toHaveBeenCalled();
  });
  it('loads every status and resolves author and seedbed names', async () => {
    const { store, api } = setup();
    await store.load();
    for (const status of ['pendiente', 'publicada', 'oculta', 'rechazada']) expect(api.get).toHaveBeenCalledWith(`/admin/seedbed-reviews?status=${status}`);
    expect(store.reviews()).toEqual([{ id: 'r1', seedbedId: 's1', seedbedName: 'Semillero A', author: 'Ana Ruiz', date: review.createdAt, text: 'Buen espacio', status: 'pendiente' }]);
    expect(store.pendingCount()).toBe(1);
  });
  it('applies the moderation status returned by the backend', async () => {
    const { store, api } = setup();
    await store.load();
    await store.moderate('r1', 'publicada');
    expect(api.patch).toHaveBeenCalledWith('/admin/seedbed-reviews/r1/moderation', { status: 'publicada', note: '' });
    expect(store.pendingCount()).toBe(0);
  });
  it('keeps local state when moderation fails', async () => {
    const { store, api } = setup();
    await store.load();
    api.patch.mockRejectedValueOnce(new Error('Forbidden'));
    await expect(store.moderate('r1', 'oculta')).rejects.toThrow('Forbidden');
    expect(store.reviews()[0].status).toBe('pendiente');
  });
});
