import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MembersAdminService } from './members-admin.service';
import { NEXT_STATES, RegistrationRequestsService } from './requests/registration-requests.service';

describe('admin services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('only allows the contract transitions', () => {
    expect(NEXT_STATES['Radicada']).toEqual(['En revisión', 'Pendiente de información']);
    expect(NEXT_STATES['Pendiente de información']).toEqual(['En revisión']);
    expect(NEXT_STATES['En revisión']).toEqual(['Aprobada', 'Rechazada']);
    expect(NEXT_STATES['Aprobada']).toEqual([]);
  });

  it('lists requests and replaces one after a state change', async () => {
    const service = TestBed.inject(RegistrationRequestsService);
    const load = service.load();
    http.expectOne('/api/admin/registration-requests').flush({ requests: [{ id: 'r1', estado: 'Radicada' }] });
    await load;
    const change = service.changeState('r1', 'En revisión', 'ok');
    const request = http.expectOne({ method: 'PATCH', url: '/api/admin/registration-requests/r1/status' });
    expect(request.request.body).toEqual({ estado: 'En revisión', observacion: 'ok' });
    request.flush({ id: 'r1', estado: 'En revisión' });
    await change;
    expect(service.requests()[0].estado).toBe('En revisión');
  });

  it('searches accounts and saves role by Firebase UID and status by member id', async () => {
    const service = TestBed.inject(MembersAdminService);
    const search = service.search(' ana ');
    http.expectOne('/api/admin/members?q=ana&limit=50').flush({ users: [
      { id: 'm1', firebase_uid: 'uid-1', name: 'Ana', last_name: 'Pérez', email: 'ana@example.test', role: 'profesor', status: 'activo' }
    ] });
    await search;
    expect(service.people()[0]).toMatchObject({ name: 'Ana Pérez', role: 'docente', status: 'active' });

    const update = service.update('m1', 'estudiante', 'inactive');
    const role = http.expectOne({ method: 'PUT', url: '/api/users/uid-1/roles' });
    expect(role.request.body).toEqual({ role: 'estudiante' });
    role.flush(null, { status: 204, statusText: 'No Content' });
    await Promise.resolve();
    const status = http.expectOne({ method: 'PATCH', url: '/api/members/m1/status' });
    expect(status.request.body).toEqual({ status: 'inactivo' });
    status.flush({});
    await update;
    expect(service.people()[0]).toMatchObject({ role: 'estudiante', status: 'inactive' });
  });

  it('keeps the saved role when the status change fails', async () => {
    const service = TestBed.inject(MembersAdminService);
    const search = service.search('ana');
    http.expectOne(() => true).flush({ users: [{ id: 'm1', firebase_uid: 'uid-1', name: 'Ana', last_name: '', email: '', role: 'visitante', status: 'activo' }] });
    await search;
    const update = service.update('m1', 'estudiante', 'inactive');
    http.expectOne('/api/users/uid-1/roles').flush(null, { status: 204, statusText: 'No Content' });
    await Promise.resolve();
    http.expectOne('/api/members/m1/status').flush({ error: 'x' }, { status: 500, statusText: 'Error' });
    await expect(update).rejects.toBeTruthy();
    expect(service.people()[0]).toMatchObject({ role: 'estudiante', status: 'active' });
  });
});
