import { InstitutionalIconComponent } from './animated-icon.component';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RevealDirective } from './reveal.directive';
import { AreaConocimiento } from './institucional.models';
@Component({ selector: 'app-nosotros-areas', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [RevealDirective, InstitutionalIconComponent], templateUrl: './areas.component.html', styleUrls: ['./universo.css', './areas.component.css'] })
export class NosotrosAreasComponent {
  @Input() logoUrl = '';
  @Input() areas: AreaConocimiento[] = [];
  @Input() publishedHtml = '';
}
