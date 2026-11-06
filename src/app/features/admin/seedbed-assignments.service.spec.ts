import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SeedbedAssignmentsService } from './seedbed-assignments.service';

describe('SeedbedAssignmentsService', () => {
  let http: HttpTestingController;
  let service: SeedbedAssignmentsService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SeedbedAssignmentsService);
  });
  afterEach(() => http.verify());

  it('loads private semilleros for the administrator', async () => {
    const load = service.list();
    http.expectOne('/api/seedbeds?includeInactive=true&page=1&pageSize=100').flush({ seedbeds: [{ id: 's1' }] });
    await expect(load).resolves.toEqual([{ id: 's1' }]);
  });
  it('changes the leader using current fields without overwriting topics', async () => {
    const save = service.assignLeader('s1', 'teacher');
    const fields = { name: 'Semillero', description: 'Descripción', researchLine: 'IA', objective: 'Investigar', contactEmail: 'grupo@example.test' };
    http.expectOne('/api/seedbeds/s1').flush({ ...fields, id: 's1', responsibleTeacherId: 'old', topics: [{ title: 'Tema' }] });
    await Promise.resolve();
    const patch = http.expectOne({ method: 'PATCH', url: '/api/seedbeds/s1' });
    expect(patch.request.body).toEqual({ ...fields, responsibleTeacherId: 'teacher' });
    patch.flush({});
    await save;
  });
  it('preserves the other delegate when assigning a member', async () => {
    const save = service.assignDelegate('s1', 'student');
    http.expectOne('/api/seedbeds/s1/members').flush({ members: [{ userId: 'other', delegate: true }, { userId: 'student', delegate: false }] });
    await Promise.resolve();
    await Promise.resolve();
    const request = http.expectOne({ method: 'PUT', url: '/api/seedbeds/s1/delegates' });
    expect(request.request.body).toEqual({ userIds: ['other', 'student'] });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await save;
  });
  it('rejects a third delegate without replacing existing assignments', async () => {
    const save = service.assignDelegate('s1', 'student');
    http.expectOne('/api/seedbeds/s1/members').flush({ members: [{ userId: 'a', delegate: true }, { userId: 'b', delegate: true }, { userId: 'student', delegate: false }] });
    await expect(save).rejects.toThrow('dos delegados');
  });
  it('rejects a person who is not a current member', async () => {
    const save = service.assignDelegate('s1', 'student');
    http.expectOne('/api/seedbeds/s1/members').flush({ members: [{ userId: 'student', leftAt: '2026-01-01', delegate: false }] });
    await expect(save).rejects.toThrow('integrante activo');
  });
});
