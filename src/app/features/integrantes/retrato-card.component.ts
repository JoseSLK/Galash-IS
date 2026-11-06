import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { Integrante, enlacePublico, etiquetaTipo } from './integrantes.service';

@Component({
  selector: 'app-retrato-card', standalone: true, imports: [RouterLink], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article>
      <a class="portrait" [routerLink]="['/integrantes', persona().id]" [queryParams]="params()" [attr.aria-label]="'Ver perfil de ' + persona().nombre">
        @if (persona().fotoUrl) { <img [src]="persona().fotoUrl" alt="" loading="lazy" (error)="imageFailed = true" [hidden]="imageFailed" /> }
        @if (!persona().fotoUrl || imageFailed) {<span class="placeholder" aria-hidden="true"><span>{{ iniciales() }}</span></span>}
        <span class="profile-chip">VER PERFIL ↗</span>
      </a>
      <p class="kind">{{ tipoLabel(persona().tipo) }} · {{ persona().semilleros.join(' / ') }}</p>
      <h2><a [routerLink]="['/integrantes', persona().id]" [queryParams]="params()">{{ persona().nombre }}</a></h2>
      <p class="description">{{ persona().formacion }}<br>{{ persona().cargo }}</p>
      @if (persona().correo) {<a class="email" [href]="'mailto:' + persona().correo">{{ persona().correo }}</a>}
      @if (persona().tipo === 'docente' && safeLink(persona().cvlacUrl); as url) {<a class="cvlac" [href]="url" target="_blank" rel="noopener noreferrer">Ver CvLAC ↗</a>}
    </article>`,
  styles: `
    :host{display:block;min-width:0}article{min-width:0}.portrait{display:block;text-decoration:none;position:relative;width:80%;max-width:220px;aspect-ratio:1;border:1px solid var(--galash-border-strong);box-sizing:border-box;border-radius:50%;overflow:hidden;background:var(--galash-surface);color:var(--galash-text)}
    .portrait img,.placeholder{width:100%;height:100%;object-fit:cover;transition:transform 700ms cubic-bezier(.2,.7,.2,1)}.placeholder{display:grid;place-items:center;position:relative;background:var(--galash-surface)}
    .placeholder>span{font:600 clamp(32px,4vw,64px)/1 var(--fuente-titulo);color:var(--galash-text-strong)}
    .profile-chip{position:absolute;bottom:22%;left:50%;white-space:nowrap;background:var(--galash-text-strong);color:var(--galash-bg);padding:8px 10px;border-radius:30px;font:12px var(--galash-mono);opacity:0;transform:translate(-50%,8px);transition:opacity 250ms,transform 250ms}
    .portrait:hover img,.portrait:focus-visible img,.portrait:hover .placeholder,.portrait:focus-visible .placeholder{transform:scale(1.07)}.portrait:hover .profile-chip,.portrait:focus-visible .profile-chip{opacity:1;transform:translate(-50%,0)}
    .kind{font:12px var(--galash-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--galash-muted);margin:20px 0 10px}h2{font:600 20px/1.4 var(--font-display);margin:0 0 10px}h2 a{color:var(--galash-text-strong);text-decoration:none}h2 a:hover{text-decoration:underline}
    .description{font:400 13px/1.65 var(--font-body);color:var(--galash-text);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin:0 0 12px}.email,.cvlac{display:block;width:fit-content;max-width:100%;overflow-wrap:anywhere;font:13px/1.7 var(--font-body);color:var(--galash-link);text-underline-offset:4px}.cvlac{margin-top:8px}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `
})
export class RetratoCard {
  readonly tipoLabel = etiquetaTipo;
  readonly persona = input.required<Integrante>();
  readonly iniciales = computed(() => this.persona().nombre.trim().split(/\s+/).slice(0, 2).map(parte => Array.from(parte)[0] ?? '').join('').toLocaleUpperCase('es'));
  readonly params = input<Params>({});
  readonly safeLink = enlacePublico;
  imageFailed = false;
}
