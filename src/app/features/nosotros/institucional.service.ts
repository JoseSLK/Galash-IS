import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { DatosInstitucionales } from './institucional.models';

// Editorial examples only: replace cargar() with the agreed HTTP adapter later.
export const INSTITUCIONAL_MOCK: DatosInstitucionales = {
  ubicacion: { nombre: 'UPTC · Seccional Sogamoso', direccion: 'Calle 4 A Sur No. 15-134, Barrio Universitario', ciudad: 'Sogamoso, Boyacá, Colombia', fuenteUrl: 'https://www.uptc.edu.co/sitio/portal/sitios/localizacion/' },
  autor: 'Contenido de demostración', actualizadoEn: '2026-11-01',
  contenido: {
    etiqueta: 'NOSOTROS · UPTC SECCIONAL SOGAMOSO', titulo: 'GALASH', logoUrl: '/assets/galash-emblema-sin-fondo.svg',
    descripcion: 'Conectamos ideas, personas y tecnología para construir conocimiento desde la ingeniería de sistemas y computación.',
    presentacion: 'GALASH es el Grupo de investigación en Auditoría, Lógica, Arquitectura de Software y Hardware de la UPTC Seccional Sogamoso. Reúne a estudiantes y docentes de ingeniería de sistemas y computación.',
    letras: [{ letra: 'G', significado: 'Grupo de investigación en' }, { letra: 'A', significado: 'Auditoría' }, { letra: 'L', significado: 'Lógica' }, { letra: 'A', significado: 'Arquitectura de' }, { letra: 'S', significado: 'Software' }, { letra: 'H', significado: 'Hardware' }],
    mision: 'Impulsar la investigación colaborativa y la formación de estudiantes mediante el estudio de sistemas de software y hardware. Texto de ejemplo pendiente de validación institucional.',
    vision: 'Consolidar una comunidad que conecte la investigación con las necesidades de su entorno. Texto de ejemplo pendiente de validación institucional.',
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
  cargar(): Observable<DatosInstitucionales | null> { return of(structuredClone(INSTITUCIONAL_MOCK)).pipe(delay(450)); }
}
