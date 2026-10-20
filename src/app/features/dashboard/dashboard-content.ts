export interface Seedbed {
  id: string;
  label: string;
  title: string;
  phrase: string;
  description: string;
  topics: string[];
  captureLabel: string;
}

export interface HeroSlide { eyebrow: string; title: string; description: string; image: string; alt: string; }

export const carouselConfig = { duration: 8000 };

export const heroSlides: HeroSlide[] = [
  { eyebrow: 'Semillero de investigación', title: 'Ideas que se convierten en soluciones', description: 'Aprendemos, investigamos y construimos tecnología con propósito.', image: '/assets/fondo.png', alt: 'Integrantes del semillero GALASH reunidos' },
  { eyebrow: 'Comunidad que aprende', title: 'Investiga lo que te mueve', description: 'Encuentra un espacio para preguntar, probar y compartir.', image: '', alt: '' },
  { eyebrow: 'Tecnología con sentido', title: 'Tu próxima pregunta empieza aquí', description: 'Conecta con personas que quieren transformar su entorno.', image: '', alt: '' }
];

export const mosaicContent = { memberCount: '00' };

export const seedbeds: Seedbed[] = [
  {
    id: 'ra',
    label: '[Semillero 1]',
    title: '[Nombre del semillero 1]',
    phrase: 'Construye, prueba y vuelve a preguntar.',
    description: '[Descripción breve del semillero 1 para editar cuando exista el contenido final.]',
    topics: ['[Tema de investigación 1]', '[Tema de investigación 2]', '[Tema de investigación 3]', '[Tema de investigación 4]'],
    captureLabel: '[Captura del semillero 1]'
  },
  {
    id: 'ia',
    label: '[Semillero 2]',
    title: '[Nombre del semillero 2]',
    phrase: 'Convierte datos en nuevas posibilidades.',
    description: '[Descripción breve del semillero 2 para editar cuando exista el contenido final.]',
    topics: ['[Tema de investigación 1]', '[Tema de investigación 2]', '[Tema de investigación 3]', '[Tema de investigación 4]'],
    captureLabel: '[Captura del semillero 2]'
  },
  {
    id: 'ciberseguridad',
    label: '[Semillero 3]',
    title: '[Nombre del semillero 3]',
    phrase: 'Experimenta con las manos y la mirada.',
    description: '[Descripción breve del semillero 3 para editar cuando exista el contenido final.]',
    topics: ['[Tema de investigación 1]', '[Tema de investigación 2]', '[Tema de investigación 3]', '[Tema de investigación 4]'],
    captureLabel: '[Captura del semillero 3]'
  }
];
