import {InstitutionalContentService} from '../../core/services/institutional-content.service';
import {LINK_CATEGORIES} from '../../core/models/institutional.model';
import { Injectable, inject } from '@angular/core';
import { Observable, defer } from 'rxjs';
import { CategoriaEnlace, DatosInstitucionales } from './institucional.models';

// Existing visual assets and location; editable text and links are read from the backend below.
export const INSTITUCIONAL_MOCK: DatosInstitucionales = {
  ubicacion: { nombre: 'UPTC · Seccional Sogamoso', direccion: 'Calle 4 A Sur No. 15-134', ciudad: 'Sogamoso, Boyacá, Colombia', fuenteUrl: 'https://www.uptc.edu.co/sitio/portal/sitios/localizacion/' },
  autor: 'Contenido de demostración', actualizadoEn: '2026-11-01',
  contenido: {
    etiqueta: 'NOSOTROS · UPTC SECCIONAL SOGAMOSO', titulo: 'GALASH', logoUrl: '/assets/galash-emblema-sin-fondo.svg',
    descripcion: 'Conectamos ideas, personas y tecnología para construir conocimiento desde la ingeniería de sistemas y computación.',
    presentacion: 'GALASH es el Grupo de investigación en Auditoría, Lógica, Arquitectura de Software y Hardware de la UPTC Seccional Sogamoso. Reúne a estudiantes y docentes de ingeniería de sistemas y computación.',
    letras: [{ letra: 'G', significado: 'Grupo de investigación en' }, { letra: 'A', significado: 'Auditoría' }, { letra: 'L', significado: 'Lógica' }, { letra: 'A', significado: 'Arquitectura de' }, { letra: 'S', significado: 'Software' }, { letra: 'H', significado: 'Hardware' }],
    mision: 'Impulsar la investigación y la formación de estudiantes en auditoría, lógica y arquitectura de software y hardware en la UPTC Seccional Sogamoso. A través de los semilleros, reunimos a estudiantes y docentes para investigar problemas del entorno, desarrollar soluciones tecnológicas y compartir lo aprendido.',
    vision: 'Consolidarnos como un grupo de investigación reconocido en la región por la formación de nuevos investigadores, la calidad de sus proyectos y sus aportes a la solución de problemas de la comunidad.',
    objetivos: ['Explorar problemas de ingeniería desde distintas áreas de conocimiento.', 'Fortalecer el aprendizaje y la colaboración entre estudiantes y docentes.', 'Compartir resultados y construir proyectos con impacto en el entorno.'],
    galeriaTitulo: 'Personas que se encuentran. Ideas que se convierten en conocimiento.',
    galeria: [
      { titulo: 'Nuestra comunidad', imagenUrl: '/assets/fondo.png', imagenAlt: 'Integrantes de GALASH frente al mural de ingeniería de sistemas' },
      { titulo: 'Espacios para compartir', imagenUrl: '/assets/img1.jpeg', imagenAlt: 'Grupo de participantes junto a una exposición de carteles académicos' },
      { titulo: 'Un entorno que nos conecta', imagenUrl: '/assets/img2.jpeg', imagenAlt: 'Espacio universitario con carteles de programas de ingeniería' }
    ],
    areas: [
      { id: 'auditoria', nombre: 'Auditoría', descripcion: 'Exploramos cómo evaluar sistemas y procesos para identificar oportunidades de mejora.' },
      { id: 'logica', nombre: 'Lógica', descripcion: 'Estudiamos el razonamiento y los fundamentos que permiten comprender y resolver problemas.' },
      { id: 'software', nombre: 'Arquitectura de software', descripcion: 'Investigamos estructuras y decisiones para construir sistemas de software.' },
      { id: 'hardware', nombre: 'Arquitectura de hardware', descripcion: 'Exploramos los componentes y las conexiones que hacen posibles los sistemas de cómputo.' }
    ],
  },
  enlaces: [
    { categoria: 'Redes sociales', nombre: 'Instagram', descripcion: 'Perfil por confirmar', url: '', activo: true },
    { categoria: 'Redes sociales', nombre: 'Facebook', descripcion: 'Perfil por confirmar', url: '', activo: true },
    { categoria: 'CvLAC', nombre: 'Trayectorias de investigación', descripcion: 'Perfiles de los investigadores. Destino pendiente de confirmación.', url: '', activo: true },
    { categoria: 'GrupLAC', nombre: 'Producción del grupo', descripcion: 'Registro institucional del grupo. Destino pendiente de confirmación.', url: '', activo: true },
  ]
};
@Injectable({ providedIn: 'root' })
export class InstitucionalService {
  private readonly api=inject(InstitutionalContentService);
  cargar(): Observable<DatosInstitucionales | null> { return defer(async()=>{
    const [published,links]=await Promise.all([this.api.pages(),this.api.links(true)]);
    const pages=published.filter(page=>page.status==='publicado');
    const latest=[...pages].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];
    return {...structuredClone(INSTITUCIONAL_MOCK),pages,
      autor:latest?.authorName||'GALASH',actualizadoEn:latest?.updatedAt.slice(0,10)||'',
      enlaces:links.map(link=>({categoria:(LINK_CATEGORIES.find(category=>category.value===link.category)?.label??link.category) as CategoriaEnlace,nombre:link.name,descripcion:link.description,url:link.url,activo:true}))};
  }); }

}
