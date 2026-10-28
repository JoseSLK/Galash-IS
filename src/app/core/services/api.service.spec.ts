import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('prefixes the API base URL, strips leading slashes and sends credentials', async () => {
    const response = api.get<{ ok: boolean }>('//auth/sessions/current');
    const request = http.expectOne('/api/auth/sessions/current');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true });
    await expect(response).resolves.toEqual({ ok: true });
  });

  it.each(['PATCH', 'PUT'] as const)('sends %s bodies with credentials', async method => {
    const body = { status: 'activo' };
    const response = method === 'PATCH'
      ? api.patch<{ ok: boolean }, typeof body>('/members/1/status', body)
      : api.put<{ ok: boolean }, typeof body>('/members/1/status', body);
    const request = http.expectOne({ method, url: '/api/members/1/status' });
    expect(request.request.body).toEqual(body);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true });
    await expect(response).resolves.toEqual({ ok: true });
  });
});
