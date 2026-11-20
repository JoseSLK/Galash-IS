import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  let http: HttpTestingController;
  let service: AuditLogsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuditLogsService);
  });

  afterEach(() => http.verify());

  it('lists logs without filters', async () => {
    const list = service.list();
    http.expectOne('/api/audit-logs').flush({ auditLogs: [{ id: 'a1', actorId: 'u1', action: 'PATCH', entity: 'links', date: '2026-11-13T10:00:00Z', result: 'success' }] });
    expect((await list)[0].id).toBe('a1');
  });

  it('sends only non-empty filters and tolerates a null list', async () => {
    const list = service.list({ actor: ' u1 ', action: '', entity: 'seedbeds', from: '2026-11-01T05:00:00.000Z' });
    http.expectOne('/api/audit-logs?actor=u1&entity=seedbeds&from=2026-11-01T05%3A00%3A00.000Z').flush({ auditLogs: null });
    expect(await list).toEqual([]);
  });
});
