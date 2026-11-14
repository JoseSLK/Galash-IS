import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/services/auth.service';
import { AuditAdminComponent, moduleOf, operationOf } from './audit-admin.component';

describe('AuditAdminComponent', () => {
  let http: HttpTestingController;
  let component: AuditAdminComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { isAdmin: () => true } }] });
    http = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(() => new AuditAdminComponent());
  });

  afterEach(() => http.verify());

  it('maps backend paths and methods to readable labels', () => {
    expect(moduleOf('/admin/registration-requests/r1/status')).toBe('Solicitudes de ingreso');
    expect(moduleOf('/links/l1')).toBe('Enlaces');
    expect(moduleOf('/otra')).toBe('Otro');
    expect(operationOf('PATCH /seedbeds/s1')).toBe('Actualización');
    expect(operationOf('DELETE /internal-calendar/events/e1')).toBe('Eliminación');
  });

  it('rejects periods longer than the maximum before any request', () => {
    component.setQuery('from', '2026-01-01');
    component.setQuery('to', '2026-03-01');
    component.prepare();
    expect(component.rangeError()).toContain('máximo');
    expect(component.pending()).toBeNull();
    http.expectNone(() => true);
  });

  it('requests only after confirmation, filters locally and skips repeated queries', async () => {
    component.setQuery('from', '2026-11-01');
    component.setQuery('to', '2026-11-07');
    component.prepare();
    http.expectNone(() => true);
    expect(component.pending()).toEqual({ from: '2026-11-01', to: '2026-11-07', actor: '' });

    const done = component.confirm();
    const request = http.expectOne(req => req.url.startsWith('/api/audit-logs?'));
    expect(request.request.url).toContain('from=');
    expect(request.request.url).not.toContain('actor=');
    request.flush({ auditLogs: [
      { id: 'a1', actorId: 'u1', action: 'PATCH /seedbeds/s1', entity: '/seedbeds/s1', date: '2026-11-02T10:00:00Z', result: 'success' },
      { id: 'a2', actorId: 'u2', action: 'POST /links', entity: '/links', date: '2026-11-03T10:00:00Z', result: 'failure' }
    ] });
    await done;

    component.setLocal('result', 'failure');
    expect(component.filtered().map(row => row.id)).toEqual(['a2']);
    component.prepare();
    expect(component.pending()).toBeNull();
    expect(component.notice()).toContain('ya están cargados');
  });
});
