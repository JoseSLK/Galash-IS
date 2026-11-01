import { SeedbedReviewsService } from './seedbed-reviews.service';

describe('local seedbed reviews demo', () => {
  it('isolates seedbeds and prepares examples only once', () => {
    const store = new SeedbedReviewsService();
    store.prepare('a', 'Semillero A'); store.prepare('a', 'Semillero A'); store.prepare('b', 'Semillero B');
    expect(store.reviews().filter(review => review.seedbedId === 'a')).toHaveLength(3);
    expect(store.reviews().filter(review => review.seedbedId === 'b')).toHaveLength(3);
  });
  it('trims text, captures author and date, and keeps a submission pending until accepted', () => {
    const store = new SeedbedReviewsService();
    const count = store.pendingCount();
    store.submit('a', 'Semillero A', 'Autora de prueba', '  Una sugerencia  ');
    const review = store.reviews()[0];
    expect(review).toMatchObject({ author: 'Autora de prueba', seedbedId: 'a', text: 'Una sugerencia', status: 'pendiente' });
    expect(Number.isNaN(Date.parse(review.date))).toBe(false);
    expect(store.pendingCount()).toBe(count + 1);
    store.moderate(review.id, 'publicada');
    expect(store.pendingCount()).toBe(count);
    expect(store.reviews()[0].status).toBe('publicada');
    store.moderate(review.id, 'oculta'); expect(store.reviews()[0].status).toBe('oculta');
    store.moderate(review.id, 'rechazada'); expect(store.reviews()[0].status).toBe('rechazada');
  });
  it('rejects empty or overlong submissions without creating records', () => {
    const store = new SeedbedReviewsService();
    const count = store.reviews().length;
    expect(() => store.submit('a', 'A', 'Prueba', '   ')).toThrow();
    expect(() => store.submit('a', 'A', 'Prueba', 'a'.repeat(2001))).toThrow();
    expect(store.reviews()).toHaveLength(count);
  });
});
