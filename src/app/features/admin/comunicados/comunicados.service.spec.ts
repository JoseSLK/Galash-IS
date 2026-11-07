import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';
import { ApiService } from '../../../core/services/api.service';
import { ComunicadosService } from './comunicados.service';

const aviso = { id: 'a1', title: 'Acta', description: 'Detalle', attachments: null, status: 'borrador', authorId: 'u1', authorName: 'Ana', createdAt: '2026-11-03T15:00:00Z', readConfirmed: false };
const reunion = { id: 'c1', seedbedId: 's1', type: 'tutoria', title: 'Tutoría', startAt: '2026-11-04T14:00:00Z', endAt: '2026-11-04T15:00:00Z', participantIds: ['u2'], participants: [{ id: 'u2', name: 'Luis', lastName: 'Gómez' }], status: 'activo' };
function setup() {
  const api = {
    get: vi.fn(async (path: string) => path === '/announcements' ? { announcements: [aviso] } : path.includes('read-status') ? { readStatus: [{ userId: 'd1', name: 'Docente', email: 'd@x', status: 'Leído' }] } : { events: [reunion, { ...reunion, id: 'c2', status: 'cancelado' }] }),
    post: vi.fn(async (path: string, body: object) => path.endsWith('/publish') ? { ...aviso, status: 'publicado', publishedAt: '2026-11-05T15:00:00Z' } : path === '/announcements' ? { ...aviso, ...body } : path === '/internal-calendar/events' ? { ...reunion, ...body } : { message: 'ok' })
  };
  const store = runInInjectionContext(Injector.create({ providers: [{ provide: ApiService, useValue: api }] }), () => new ComunicadosService());
  return { store, api };
}
describe('comunicados y cronograma API integration', () => {
  it('loads announcements and the month range of active meetings', async () => {
    const { store, api } = setup();
    await store.cargar(new Date(2026, 10, 1));
    const calendar = api.get.mock.calls.map(c => c[0]).find(p => p.startsWith('/internal-calendar/events?'))!;
    const params = new URLSearchParams(calendar.split('?')[1]);
    expect(new Date(params.get('from')!).getTime()).toBe(new Date(2026, 10, 1).getTime());
    expect(new Date(params.get('to')!) < new Date(2026, 11, 1)).toBe(true);
    expect(params.get('view')).toBe('month');
    expect(store.items().map(i => i.id)).toEqual(['a1', 'c1']);
    expect(store.items()[0]).toMatchObject({ tipo: 'comunicado', borrador: true, autor: 'Ana', adjuntos: [] });
    expect(store.items()[1]).toMatchObject({ tipo: 'reunion', categoria: 'Tutoría', seedbedId: 's1', participantes: ['Luis Gómez'] });
  });
  it('leader scope skips announcements and filters by seedbed', async () => {
    const { store, api } = setup();
    await store.cargar(new Date(2026, 10, 1), false, 's1');
    expect(api.get).not.toHaveBeenCalledWith('/announcements');
    expect(api.get.mock.calls[0][0]).toContain('&seedbedId=s1');
  });
  it('creates, publishes and confirms reading an announcement', async () => {
    const { store, api } = setup();
    await store.crearComunicado('Acta', 'Detalle', [{ name: 'acta.pdf', url: 'https://x.co/acta.pdf' }]);
    expect(api.post).toHaveBeenCalledWith('/announcements', { title: 'Acta', description: 'Detalle', attachments: [{ name: 'acta.pdf', url: 'https://x.co/acta.pdf' }] });
    await store.publicar('a1');
    expect(store.items()[0].borrador).toBe(false);
    await store.leer('a1');
    expect(api.post).toHaveBeenCalledWith('/announcements/a1/read-confirmations', {});
    expect(store.items()[0].leido).toBe(true);
    expect(await store.lecturas('a1')).toHaveLength(1);
  });
  it('creates a meeting with the contract payload and surfaces a 409 conflict', async () => {
    const { store, api } = setup();
    const data = { seedbedId: 's1', type: 'reunion' as const, title: 'R', description: '', startAt: '2026-11-04T14:00:00.000Z', endAt: '2026-11-04T15:00:00.000Z', participantIds: ['u2'] };
    await store.crearReunion(data);
    expect(api.post).toHaveBeenCalledWith('/internal-calendar/events', data);
    api.post.mockRejectedValueOnce(Object.assign(new Error('conflict'), { status: 409 }));
    await expect(store.crearReunion(data)).rejects.toThrow('conflict');
    expect(store.items()).toHaveLength(1);
  });
});
