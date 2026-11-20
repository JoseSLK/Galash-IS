import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { IntegrantesService, fotoEnAlta } from './integrantes.service';

describe('IntegrantesService', () => {
  let service: IntegrantesService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(IntegrantesService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses photo_url from the member profile as the portrait link', async () => {
    const list = firstValueFrom(service.listar());
    const base = { last_name: 'Pérez', role: 'estudiante', status: 'activo', visible_publicly: true };
    http.expectOne('/api/members?limit=100').flush({ members: [
      { ...base, id: 'a', name: 'Ana', photo_url: 'https://example.test/ana.jpg' },
      { ...base, id: 'b', name: 'Beto', photo_url: '' }
    ] });
    http.expectOne('/api/seedbeds').flush({ seedbeds: [] });
    const [ana, beto] = await list;
    expect(ana.fotoUrl).toBe('https://example.test/ana.jpg');
    expect(beto.fotoUrl).toBeUndefined();
  });
});

describe('fotoEnAlta', () => {
  it('asks known avatar CDNs for a larger image and leaves other URLs untouched', () => {
    expect(fotoEnAlta('https://lh3.googleusercontent.com/a/ACg8ocX=s96-c')).toBe('https://lh3.googleusercontent.com/a/ACg8ocX=s840-c');
    expect(fotoEnAlta('https://lh3.googleusercontent.com/-abc/s96-c/photo.jpg')).toBe('https://lh3.googleusercontent.com/-abc/s840-c/photo.jpg');
    expect(fotoEnAlta('https://avatars.githubusercontent.com/u/1?v=4')).toBe('https://avatars.githubusercontent.com/u/1?v=4&s=840');
    expect(fotoEnAlta('https://www.gravatar.com/avatar/abc?s=80')).toBe('https://www.gravatar.com/avatar/abc?s=840');
    expect(fotoEnAlta('https://example.test/ana.jpg')).toBe('https://example.test/ana.jpg');
    expect(fotoEnAlta('no es url')).toBe('no es url');
  });
});
