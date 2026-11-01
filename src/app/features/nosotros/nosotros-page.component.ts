import { NosotrosObjetivosComponent } from './objetivos.component';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { InstitucionalService } from './institucional.service';
import { DatosInstitucionales } from './institucional.models';
import { NosotrosHeroComponent } from './hero.component';
import { NosotrosMisionVisionComponent } from './mision-vision.component';
import { NosotrosGaleriaComponent } from './galeria.component';
import { NosotrosAreasComponent } from './areas.component';
import { NosotrosEnlacesComponent } from './enlaces.component';
import { NosotrosColaborarComponent } from './colaborar.component';
@Component({ selector: 'app-nosotros-page', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NosotrosObjetivosComponent, DashboardComponent, SiteFooterComponent, NosotrosHeroComponent, NosotrosMisionVisionComponent, NosotrosGaleriaComponent, NosotrosAreasComponent, NosotrosEnlacesComponent, NosotrosColaborarComponent],
  templateUrl: './nosotros-page.component.html', styleUrls: ['./universo.css', './nosotros-page.component.css']
})
export class NosotrosPageComponent implements OnInit, OnDestroy {
  private readonly service = inject(InstitucionalService);
  private request?: Subscription;
  readonly state = signal<'loading' | 'ready' | 'error' | 'empty'>('loading');
  readonly datos = signal<DatosInstitucionales | null>(null);
  ngOnInit(): void { this.load(); }
  load(): void {
    this.request?.unsubscribe(); this.state.set('loading');
    this.request = this.service.cargar().subscribe({ next: datos => { this.datos.set(datos); this.state.set(datos ? 'ready' : 'empty'); }, error: () => this.state.set('error') });
  }
  ngOnDestroy(): void { this.request?.unsubscribe(); }
}
