import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { RevealDirective } from './reveal.directive';
import { FotoGaleria } from './institucional.models';
@Component({selector:'app-nosotros-galeria',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[RevealDirective],templateUrl:'./galeria.component.html',styleUrls:['./universo.css','./galeria.component.css']})
export class NosotrosGaleriaComponent {
 @Input() fotos: FotoGaleria[]=[]; @Input() titulo='';
 get tarjetas(): FotoGaleria[] { return this.fotos.length > 1 && this.fotos.length % 2 ? [...this.fotos, this.fotos[0]] : this.fotos; }
 readonly paused=signal(false);
 toggle():void {this.paused.update(value=>!value);}
}
