import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProfileAssignmentsService } from './profile-assignments.service';

describe('ProfileAssignmentsService', () => {
  let service: ProfileAssignmentsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProfileAssignmentsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('shows leader and delegate assignments based on the current server profile', async () => {
    const load = service.load();
    http.expectOne('/api/users/me').flush({ id: 'teacher', managed_seedbed_ids: ['s1', 's2', 's1'] });
    await Promise.resolve();
    http.expectOne('/api/seedbeds/s1').flush({ name: 'Semillero IA', responsibleTeacherId: 'teacher' });
    http.expectOne('/api/seedbeds/s2').flush({ name: 'Semillero Web', responsibleTeacherId: 'other' });
    await expect(load).resolves.toEqual([
      { id: 's1', name: 'Semillero IA', function: 'Líder de semillero' },
      { id: 's2', name: 'Semillero Web', function: 'Delegado' }
    ]);
  });
  it('does not claim a function when the backend reports no managed semilleros', async () => {
    const load = service.load();
    http.expectOne('/api/users/me').flush({ id: 'teacher', managed_seedbed_ids: [] });
    await expect(load).resolves.toEqual([]);
  });
  it('keeps confirmed assignments and marks inaccessible details without inventing a role', async () => {
    const load = service.load();
    http.expectOne('/api/users/me').flush({ id: 'teacher', managed_seedbed_ids: ['hidden', 's1'] });
    await Promise.resolve();
    http.expectOne('/api/seedbeds/hidden').flush({}, { status: 404, statusText: 'Not Found' });
    http.expectOne('/api/seedbeds/s1').flush({ name: 'Semillero IA', responsibleTeacherId: 'teacher' });
    await expect(load).resolves.toEqual([
      { id: 'hidden', name: 'Semillero no disponible', function: 'Función de gestión', unavailable: true },
      { id: 's1', name: 'Semillero IA', function: 'Líder de semillero' }
    ]);
  });
});
