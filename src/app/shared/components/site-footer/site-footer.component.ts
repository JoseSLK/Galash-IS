import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialLinksComponent } from '../social-links/social-links.component';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, SocialLinksComponent],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css'
})
export class SiteFooterComponent {
  @Input() seedbedId = '';
  readonly year = new Date().getFullYear();
  mostrarAutores = false;
  readonly autores: { nombre: string; rol: string; fotoUrl: string }[] = [
    { nombre: 'Valentina Vega Gonsales', rol: 'Scrum Master', fotoUrl: 'https://res.cloudinary.com/dbuat2srn/image/upload/v1795808768/1781665193681_1.jpg_zgki64.jpg' },
    { nombre: 'Daniel Mauricio Vargas Cely', rol: 'Product Owner', fotoUrl: 'https://res.cloudinary.com/dbuat2srn/image/upload/v1795808393/WhatsApp_Image_2026-11-27_at_2.39.34_PM_atbik2.jpg' },
    { nombre: 'José Luis Salamanca López', rol: 'Equipo de desarrollo', fotoUrl: 'https://res.cloudinary.com/dbuat2srn/image/upload/v1795807948/1760816121684_2_1_f3azae.jpg' },
    { nombre: 'Laura Valentina Urueña Bejarano', rol: 'Equipo de desarrollo', fotoUrl: 'https://res.cloudinary.com/dbuat2srn/image/upload/v1795808726/WhatsApp_Image_2026-11-27_at_2.45.04_PM_m2ulx0.jpg' },
    { nombre: 'Bibian Jinnary Corredor Corredor', rol: 'Equipo de desarrollo', fotoUrl: 'https://res.cloudinary.com/dbuat2srn/image/upload/v1795808511/WhatsApp_Image_2026-11-27_at_2.41.35_PM_dpqr97.jpg' },
  ];
  iniciales(nombre: string): string {
    return nombre.trim().split(/\s+/).slice(0, 2).map(parte => Array.from(parte)[0] ?? '').join('').toLocaleUpperCase('es');
  }
}
