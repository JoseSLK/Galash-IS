import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { RevealDirective } from './reveal.directive';
import { FormsModule } from '@angular/forms';
@Component({ selector: 'app-nosotros-colaborar', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [RevealDirective, FormsModule], templateUrl: './colaborar.component.html', styleUrls: ['./universo.css', './colaborar.component.css'] })
export class NosotrosColaborarComponent {
  email = ''; submitted = false;
  readonly feedback = signal('');
  send(valid: boolean | null): void { this.submitted = true; this.feedback.set(valid ? 'Correo válido. Este formulario es una demostración: no se ha enviado ni guardado información.' : 'Escribe un correo electrónico válido.'); }
}
