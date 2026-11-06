import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({selector: 'app-paginador', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="pagination"><p>Mostrando {{ total() ? (page() - 1) * size() + 1 : 0 }}–{{ end() }} de {{ total() }}</p><nav aria-label="Páginas de integrantes"><button class="arrow" type="button" aria-label="Página anterior" [disabled]="page() <= 1" (click)="cambio.emit(page() - 1)">←</button>@for (numero of pages(); track numero) {<button type="button" [attr.aria-label]="'Página ' + numero" [attr.aria-current]="page() === numero ? 'page' : null" (click)="cambio.emit(numero)">{{ numero }}</button>}<button class="arrow" type="button" aria-label="Página siguiente" [disabled]="page() >= pages().length" (click)="cambio.emit(page() + 1)">→</button></nav></div>`,
  styles: `.pagination{display:flex;justify-content:space-between;align-items:center;gap:20px;border-top:1px solid var(--galash-border);padding-top:26px;margin-top:48px}p{font:12px var(--galash-mono);color:var(--galash-muted)}nav{display:flex;gap:8px}button{width:38px;height:38px;background:none;border:0;color:var(--galash-text);cursor:pointer}button[aria-current]{border-bottom:3px solid var(--galash-accent);color:white}.arrow{border:1px solid var(--galash-border-strong);border-radius:50%;font-size:20px}button:disabled{opacity:.35;cursor:default}@media(max-width:500px){.pagination{flex-direction:column;align-items:flex-start}}`
})
export class Paginador {
  readonly page = input(1); readonly size = input(8); readonly total = input(0);
  readonly cambio = output<number>();
  readonly pages = computed(() => Array.from({length: Math.max(1, Math.ceil(this.total() / this.size()))}, (_, i) => i + 1));
  readonly end = computed(() => Math.min(this.page() * this.size(), this.total()));
}
