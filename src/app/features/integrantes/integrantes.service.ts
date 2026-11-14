import { Injectable, inject } from '@angular/core';
import { Observable, defer } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SeedbedsService } from '../seedbeds/seedbeds.service';

export interface Integrante {
  id: string;
  nombre: string;
  tipo: 'docente' | 'estudiante' | 'egresado' | 'investigador_exterior' | 'lider_semillero';
  cargo: string;
  formacion: string;
  correo: string;
  semilleros: string[];
  area: string;
  fotoUrl?: string;
  cvlacUrl?: string;
  publicaciones: { titulo: string; anio: number; url?: string }[];
  activo: boolean;
}

export const TIPOS_INTEGRANTE = [
  { value: 'docente', label: 'Docente', filtro: 'Docentes' },
  { value: 'estudiante', label: 'Estudiante', filtro: 'Estudiantes' },
  { value: 'egresado', label: 'Egresado', filtro: 'Egresados' },
  { value: 'investigador_exterior', label: 'Investigador exterior', filtro: 'Investigador exterior' },
  { value: 'lider_semillero', label: 'Líder de semillero', filtro: 'Líder de semillero' }
] as const;
export const etiquetaTipo = (tipo: Integrante['tipo']): string => TIPOS_INTEGRANTE.find(opcion => opcion.value === tipo)?.label ?? '';

export const normalizar = (texto: string): string => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
export function enlacePublico(value?: string): string | null {
  if (!value) return null;
  try { return new URL(value).protocol === 'https:' ? value : null; } catch { return null; }
}

interface PerfilPublico {
  id: string; name: string; last_name: string; role: string; status: string;
  visible_publicly: boolean; area?: string; formation?: string; cvlac?: string; seedbed_ids?: string[]; photo_url?: string;
}

@Injectable({ providedIn: 'root' })
export class IntegrantesService {
  private readonly api = inject(ApiService);
  private readonly seedbeds = inject(SeedbedsService);
  retorno?: { url: string; scroll: number };
  listar(): Observable<Integrante[]> {
    return defer(async () => {
      const [response, semilleros] = await Promise.all([
        this.api.get<{members: PerfilPublico[] | null}>('/members?limit=100'), this.seedbeds.list()
      ]);
      const nombres = new Map(semilleros.map(item => [item.id, item.name]));
      return (response.members ?? []).filter(p => p.status === 'activo' && p.visible_publicly).map(p => {
        const tipo: Integrante['tipo'] = p.role === 'profesor' ? 'docente' : p.role as Integrante['tipo'];
        return {id:p.id, nombre:[p.name,p.last_name].filter(Boolean).join(' '), tipo,
          cargo:etiquetaTipo(tipo), formacion:p.formation || 'Formación no registrada', correo:'',
          semilleros:(p.seedbed_ids ?? []).map(id => nombres.get(id) ?? 'Semillero no disponible'),
          area:p.area || 'Área no registrada', fotoUrl:p.photo_url || undefined, cvlacUrl:p.cvlac, publicaciones:[], activo:true};
      });
    });
  }
  // Admin only (backend enforces): stores just the image link; "" removes the photo.
  async actualizarFoto(id: string, url: string): Promise<string> {
    return (await this.api.put<{photo_url: string}, {photo_url: string}>(`/users/${encodeURIComponent(id)}/photo`, {photo_url: url})).photo_url;
  }
  async publicaciones(id: string): Promise<Integrante['publicaciones']> {
    const response = await this.api.get<{publications: {title:string; published_at?:string; url?:string}[] | null}>(`/members/${encodeURIComponent(id)}/publications`);
    return (response.publications ?? []).map(p => ({titulo:p.title, anio:p.published_at ? new Date(p.published_at).getUTCFullYear() : 0, url:p.url}));
  }
}

/** Pide una versión más grande a los CDN de avatares conocidos; otras URL quedan igual. */
// LinkedIn media links carry a signed expiry (e=...); once it passes the image stops loading.
export const AVISO_ENLACE_TEMPORAL = 'Los enlaces de imágenes de LinkedIn vencen en pocos días y la foto dejará de verse. Usa un enlace permanente, por ejemplo de Google Fotos, Gravatar o un servidor propio.';
export function enlaceTemporal(url: string): boolean {
  try { return new URL(url.trim()).hostname.endsWith('licdn.com'); } catch { return false; }
}
export function fotoEnAlta(url: string, lado = 840): string {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('googleusercontent.com')) {
      if (/=s\d+[^/]*$/.test(u.pathname)) u.pathname = u.pathname.replace(/=s\d+[^/]*$/, `=s${lado}-c`);
      else if (/\/s\d+(-c)?\//.test(u.pathname)) u.pathname = u.pathname.replace(/\/s\d+(-c)?\//, `/s${lado}-c/`);
      else return url;
    } else if (u.hostname === 'avatars.githubusercontent.com' || u.hostname.endsWith('gravatar.com')) u.searchParams.set('s', String(lado));
    else return url;
    return u.toString();
  } catch { return url; }
}
