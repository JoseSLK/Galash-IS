import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { InstitucionalService, INSTITUCIONAL_MOCK } from './institucional.service';
import { externalUrl } from './external-url';
import { NosotrosEnlacesComponent } from './enlaces.component';

describe('institutional mock and public content rules', () => {
  afterEach(() => vi.useRealTimers());
  it('delays the typed result and isolates each response from mutations', async () => {
    vi.useFakeTimers();
    const service = new InstitucionalService();
    let emitted = false;
    const result = firstValueFrom(service.cargar()).then(value => { emitted = true; return value; });
    await vi.advanceTimersByTimeAsync(449); expect(emitted).toBe(false);
    await vi.advanceTimersByTimeAsync(1); const data = await result;
    expect(data!.contenido.letras.map(item => item.letra).join('')).toBe('GALASH');
    data!.contenido.objetivos.length = 0;
    expect(INSTITUCIONAL_MOCK.contenido.objetivos.length).toBeGreaterThan(0);
  });
  it('excludes inactive official links from their category', () => {
    const component = runInInjectionContext(Injector.create({providers:[{provide:DomSanitizer,useValue:{bypassSecurityTrustResourceUrl:(value:string)=>value}}]}),()=>new NosotrosEnlacesComponent());
    component.enlaces = [
      { categoria: 'CvLAC', nombre: 'Visible', descripcion: 'Test', url: 'https://example.test', activo: true },
      { categoria: 'CvLAC', nombre: 'Inactive', descripcion: 'Test', url: 'https://example.test', activo: false }
    ];
    expect(component.links('CvLAC').map(link => link.nombre)).toEqual(['Visible']);
    expect(component.links('GrupLAC')).toEqual([]);
  });
  it('accepts valid external destinations and omits unsafe or absent CvLAC URLs', () => {
    expect(externalUrl('https://example.test/cvlac')).toBe('https://example.test/cvlac');
    expect(externalUrl('javascript:alert(1)')).toBeNull();
    expect(externalUrl('not a url')).toBeNull(); expect(externalUrl()).toBeNull();
  });
});
