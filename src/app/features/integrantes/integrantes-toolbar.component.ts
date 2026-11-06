import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { Integrante, TIPOS_INTEGRANTE } from './integrantes.service';

export interface FiltrosIntegrantes { q: string; tipo: string; sem: string; vista: 'retratos' | 'tabla'; page: number; }
export const FILTROS_INICIALES: FiltrosIntegrantes = { q: '', tipo: '', sem: '', vista: 'retratos', page: 1 };
type Menu = 'tipo' | 'sem';

@Component({selector: 'app-integrantes-toolbar', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './integrantes-toolbar.component.html', styleUrl: './integrantes-toolbar.component.css'})
export class IntegrantesToolbar {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly filtros = input.required<FiltrosIntegrantes>();
  readonly personas = input.required<Integrante[]>();
  readonly total = input(0);
  readonly cambio = output<Partial<FiltrosIntegrantes>>();
  readonly busqueda = output<string>();
  readonly limpiar = output<void>();
  readonly abierto = signal<Menu | null>(null);
  readonly menus: { key: Menu; label: string }[] = [{key:'tipo',label:'Tipo'}, {key:'sem',label:'Semillero'}];
  readonly opciones = computed<Record<Menu, { value: string; label: string }[]>>(() => {
    const values = (items: string[]) => [...new Set(items)].sort((a,b) => a.localeCompare(b,'es')).map(value => ({ value, label: value }));
    return {
      tipo: TIPOS_INTEGRANTE.map(opcion => ({value: opcion.value, label: opcion.filtro})),
      sem: values(this.personas().flatMap(persona => persona.semilleros))
    };
  });
  readonly activo = computed(() => ['q','tipo','sem'].some(key => !!this.filtros()[key as keyof FiltrosIntegrantes]));
  label(menu: Menu): string { return this.opciones()[menu].find(op => op.value === this.filtros()[menu])?.label ?? this.filtros()[menu]; }
  toggle(menu: Menu): void {
    this.abierto.set(this.abierto() === menu ? null : menu);
    if (this.abierto()) setTimeout(() => this.element.nativeElement.querySelector<HTMLElement>(`#filtro-${menu} [role="menuitem"]`)?.focus());
  }
  elegir(menu: Menu, value: string): void { this.cambio.emit({ [menu]: value, page: 1 }); this.cerrar(); }
  cerrar(): void {
    const menu = this.abierto(); this.abierto.set(null);
    if (menu) this.element.nativeElement.querySelector<HTMLButtonElement>(`#boton-${menu}`)?.focus();
  }
  navegar(event: KeyboardEvent, menu: Menu): void {
    const items = Array.from(this.element.nativeElement.querySelectorAll<HTMLButtonElement>(`#filtro-${menu} [role="menuitem"]`));
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    let target: number;
    switch (event.key) {
      case 'ArrowDown': target = (index + 1) % items.length; break;
      case 'ArrowUp': target = (index - 1 + items.length) % items.length; break;
      case 'Home': target = 0; break;
      case 'End': target = items.length - 1; break;
      case 'Tab': this.cerrar(); return;
      default: return;
    }
    event.preventDefault(); items[target]?.focus();
  }
  @HostListener('document:click', ['$event']) outside(event: Event): void { if (!this.element.nativeElement.contains(event.target as Node)) this.abierto.set(null); }
  @HostListener('document:keydown.escape') escape(): void { this.cerrar(); }
}
