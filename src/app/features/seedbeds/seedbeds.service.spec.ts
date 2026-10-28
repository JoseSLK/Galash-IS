import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SeedbedsService, seedbedAbbreviation } from './seedbeds.service';

describe('SeedbedsService', () => {
  let service: SeedbedsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SeedbedsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps the seedbed list and treats null as empty', async () => {
    const list = service.list();
    http.expectOne({ method: 'GET', url: '/api/seedbeds' }).flush({ seedbeds: null });
    await expect(list).resolves.toEqual([]);
  });

  it('reads members, activities and projects of one seedbed', async () => {
    const members = service.members('a/b');
    const activities = service.activities('a/b');
    const projects = service.projects('a/b');
    http.expectOne('/api/seedbeds/a%2Fb/members').flush({ members: [{ userId: 'u1' }] });
    http.expectOne('/api/seedbeds/a%2Fb/activities').flush({ activities: [{ id: 'a1' }] });
    http.expectOne('/api/projects?seedbedId=a%2Fb').flush({ projects: [{ id: 'p1', status: 'Activo' }] });
    await expect(members).resolves.toEqual([{ userId: 'u1' }]);
    await expect(activities).resolves.toEqual([{ id: 'a1' }]);
    await expect(projects).resolves.toEqual([{ id: 'p1', status: 'Activo' }]);
  });

  it('returns the composite space view as sent', async () => {
    const space = service.space('s1');
    const body = { seedbed: { id: 's1' }, purpose: 'p', responsible: { id: 't', name: 'Ana', lastName: 'Pérez' } };
    http.expectOne('/api/seedbeds/s1/space').flush(body);
    await expect(space).resolves.toEqual(body);
  });

  it('derives the knowledge graph abbreviation from the name', () => {
    expect(seedbedAbbreviation('Realidad aumentada')).toBe('RA');
    expect(seedbedAbbreviation('Inteligencia artificial')).toBe('IA');
    expect(seedbedAbbreviation('Ciberseguridad')).toBe('CIBER');
    expect(seedbedAbbreviation('Robótica de servicio')).toBe('RS');
  });
});
