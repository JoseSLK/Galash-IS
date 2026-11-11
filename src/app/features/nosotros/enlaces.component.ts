import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { RevealDirective } from './reveal.directive';
import { SocialLinksComponent } from '../../shared/components/social-links/social-links.component';
import { CategoriaEnlace, EnlaceOficial, UbicacionInstitucional } from './institucional.models';
import { externalUrl } from './external-url';
@Component({ selector: 'app-nosotros-enlaces', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [RevealDirective, SocialLinksComponent], templateUrl: './enlaces.component.html', styleUrls: ['./universo.css', './enlaces.component.css'] })
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
  private readonly allCategories: CategoriaEnlace[] = ['Redes sociales', 'CvLAC', 'GrupLAC', 'MinCiencias', 'Repositorios'];
  get categories(): CategoriaEnlace[] { return this.allCategories.filter(category=>this.links(category).length>0); }
  links(category: CategoriaEnlace): EnlaceOficial[] { return this.enlaces.filter(link => link.activo && link.categoria === category && !!this.safeUrl(link.url)); }
}
