import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { RevealDirective } from './reveal.directive';
import { CategoriaEnlace, EnlaceOficial, UbicacionInstitucional } from './institucional.models';
import { externalUrl } from './external-url';
@Component({ selector: 'app-nosotros-enlaces', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [RevealDirective], templateUrl: './enlaces.component.html', styleUrls: ['./universo.css', './enlaces.component.css'] })
export class NosotrosEnlacesComponent implements OnChanges {
  @Input() ubicacion?: UbicacionInstitucional;
  private readonly sanitizer = inject(DomSanitizer);
  mapaUrl: SafeResourceUrl | null = null;
  mapaExterno = '';
  ngOnChanges(): void {
    const query = this.ubicacion ? encodeURIComponent(this.ubicacion.nombre + ', ' + this.ubicacion.direccion + ', ' + this.ubicacion.ciudad) : '';
    this.mapaExterno = query ? 'https://www.google.com/maps?q=' + query : '';
    this.mapaUrl = query ? this.sanitizer.bypassSecurityTrustResourceUrl('https://www.google.com/maps?q=' + query + '&output=embed') : null;
  }

  @Input() enlaces: EnlaceOficial[] = [];
  readonly safeUrl = externalUrl;
  readonly categories: CategoriaEnlace[] = ['Redes sociales', 'CvLAC', 'GrupLAC'];
  links(category: CategoriaEnlace): EnlaceOficial[] { return this.enlaces.filter(link => link.activo && link.categoria === category); }
}
