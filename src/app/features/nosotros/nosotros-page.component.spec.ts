import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { Subject, of, throwError } from 'rxjs';
import { InstitucionalService, INSTITUCIONAL_MOCK } from './institucional.service';
import { DatosInstitucionales } from './institucional.models';
import { NosotrosPageComponent } from './nosotros-page.component';
function create(cargar: ReturnType<typeof vi.fn>): NosotrosPageComponent {
  const injector = Injector.create({ providers: [{ provide: InstitucionalService, useValue: { cargar } }] });
  return runInInjectionContext(injector, () => new NosotrosPageComponent());
}
describe('institutional page loading lifecycle', () => {
  it('shows error and retries through the injected service', () => {
    const cargar = vi.fn().mockReturnValueOnce(throwError(() => new Error('offline'))).mockReturnValueOnce(of(INSTITUCIONAL_MOCK));
    const page = create(cargar);
    expect(page.state()).toBe('loading'); page.ngOnInit(); expect(page.state()).toBe('error');
    page.load(); expect(page.state()).toBe('ready'); expect(page.datos()?.contenido.mision).toBe(INSTITUCIONAL_MOCK.contenido.mision);
    page.ngOnDestroy();
  });
  it('shows the empty state when no published content is returned', () => {
    const page = create(vi.fn().mockReturnValue(of(null))); page.load(); expect(page.state()).toBe('empty'); page.ngOnDestroy();
  });
  it('cancels superseded loads and releases the current subscription on destruction', () => {
    const first = new Subject<DatosInstitucionales>(), second = new Subject<DatosInstitucionales>();
    const page = create(vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second));
    page.load(); page.load(); expect(first.observed).toBe(false);
    first.next(INSTITUCIONAL_MOCK); expect(page.state()).toBe('loading');
    second.next(INSTITUCIONAL_MOCK); expect(page.state()).toBe('ready');
    page.ngOnDestroy(); expect(second.observed).toBe(false);
  });
});
