import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { InstitucionalService, INSTITUCIONAL_MOCK } from './institucional.service';
import { externalUrl } from './external-url';
import { InstitutionalContentService } from '../../core/services/institutional-content.service';
import { NosotrosEnlacesComponent } from './enlaces.component';

describe('institutional mock and public content rules', () => {
  it('combines published pages and visible links with an isolated copy of the base content', async () => {
    const api = {
      pages: vi.fn(async () => [
        { id: '1', status: 'publicado', authorName: 'Ana', updatedAt: '2026-10-02T10:00:00Z' },
        { id: '2', status: 'borrador', authorName: 'Beto', updatedAt: '2026-10-05T10:00:00Z' },
        { id: '3', status: 'publicado', authorName: 'Caro', updatedAt: '2026-10-03T10:00:00Z' }
      ]),
      links: vi.fn(async () => [{ category: 'cvlac', name: 'CvLAC', description: 'Perfil', url: 'https://example.test' }])
    };
    const service = runInInjectionContext(Injector.create({ providers: [{ provide: InstitutionalContentService, useValue: api }] }), () => new InstitucionalService());
    const data = await firstValueFrom(service.cargar());
    expect(api.links).toHaveBeenCalledWith(true);
    expect(data!.pages?.map(page => page.id)).toEqual(['1', '3']);
    expect(data!.autor).toBe('Caro');
    expect(data!.actualizadoEn).toBe('2026-10-03');
    expect(data!.enlaces).toEqual([{ categoria: 'CvLAC', nombre: 'CvLAC', descripcion: 'Perfil', url: 'https://example.test', activo: true }]);
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
