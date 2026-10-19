import { Component } from '@angular/core';
import { KnowledgeGraphComponent, KnowledgeGraphData } from '../../shared/components/knowledge-graph/knowledge-graph.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';

@Component({
  selector: 'app-seedbeds',
  standalone: true,
  imports: [DashboardComponent, SiteFooterComponent, KnowledgeGraphComponent],
  templateUrl: './seedbeds.component.html',
  styleUrl: './seedbeds.component.css'
})
export class SeedbedsComponent {
  readonly seedbeds = ['RA', 'IA', 'Ciberseguridad'] as const;
  selectedSeedbed: typeof this.seedbeds[number] = 'Ciberseguridad';
  readonly knowledgeGraphs: Record<typeof this.seedbeds[number], KnowledgeGraphData> = {
    RA: { name: 'Realidad aumentada', abbreviation: 'RA', nodes: ['Experiencias', 'Entorno', 'Personas', 'Interacción'].map(title => ({ title, phrase: '[Texto de ejemplo]' })) },
    IA: { name: 'Inteligencia artificial', abbreviation: 'IA', nodes: ['Modelos', 'Datos', 'Personas', 'Aprendizaje'].map(title => ({ title, phrase: '[Texto de ejemplo]' })) },
    Ciberseguridad: { name: 'Ciberseguridad', abbreviation: 'CIBER', nodes: ['Aplicaciones', 'Datos', 'Personas', 'Riesgos'].map(title => ({ title, phrase: '[Texto de ejemplo]' })) }
  };
  readonly statuses = ['Todos', 'Activos', 'Finalizados', 'Radicados'];
  selectedStatus = 'Activos';
  readonly eventOrders = ['Más recientes', 'Más antiguos'];
  selectedEventOrder = 'Más recientes';
  selectedDetail: { title: string; description: string; kind: string; metadata: string } | null = null;
  memberOffset = 0;
  private readonly cyberMembers = [
    { name: 'Edmundo Junco', role: 'Profesor' },
    { name: 'Fabian Medina', role: 'Profesor' },
    { name: 'Olga Lucia', role: 'Estudiante' },
    { name: 'Cristian Suancha', role: 'Estudiante' },
    { name: 'Integrante Ciber 05', role: 'Estudiante' },
    { name: 'Integrante Ciber 06', role: 'Profesor' },
    { name: 'Integrante Ciber 07', role: 'Estudiante' },
    { name: 'Integrante Ciber 08', role: 'Estudiante' }
  ];
  private readonly cyberEvents = [
    { date: '2026-04-20', day: '20', month: 'Abr 2026', type: 'Congresos', title: 'Congreso de OWASP', description: 'Encuentro sobre seguridad en aplicaciones y buenas prácticas de desarrollo.' },
    { date: '2026-10-06', day: '6', month: 'Oct 2026', type: 'Encuentros', title: 'Participación Docentes', description: 'Espacio de intercambio de experiencias y avances de investigación.' },
    { date: '2026-09-20', day: '20', month: 'Sept 2026', type: 'Ponencias', title: 'Ponencia Universidad Boyacá', description: 'Presentación de los proyectos y aprendizajes del semillero.' },
    { date: '2026-11-12', day: '12', month: 'Nov 2026', type: 'Encuentros', title: 'Encuentro de semilleros', description: 'Jornada para compartir ideas, conocer iniciativas y conectar equipos de investigación.' }
  ];
  private readonly cyberProjects = [
    { id: 1, title: 'Chatbot para orientación psicológica', description: 'Asistente de apoyo para orientar a la comunidad universitaria.', status: 'Activos' },
    { id: 2, title: 'Análisis de seguridad en aplicaciones', description: 'Exploración de vulnerabilidades y prácticas de protección de datos.', status: 'Activos' },
    { id: 3, title: 'Plataforma de aprendizaje seguro', description: 'Recursos para aprender sobre privacidad y seguridad digital.', status: 'Activos' },
    { id: 4, title: 'Detección de mensajes sospechosos', description: 'Estudio de señales para reconocer intentos de suplantación.', status: 'Activos' },
    { id: 5, title: 'Guía de protección de datos', description: 'Material de consulta sobre el cuidado de la información personal.', status: 'Finalizados' },
    { id: 6, title: 'Taller de ciudadanía digital', description: 'Experiencia de formación en prácticas responsables en internet.', status: 'Radicados' }
  ];
  readonly content = {
    Ciberseguridad: {
      description: 'Investigamos cómo proteger aplicaciones, datos y personas frente a los riesgos del entorno digital.',
      coordinator: 'Coordinación de Ciberseguridad',
      focus: 'Seguridad digital · Perfil temporal',
      members: this.cyberMembers,
      events: this.cyberEvents,
      projects: this.cyberProjects
    },
    RA: {
      description: 'Exploramos experiencias de realidad aumentada para conectar el mundo físico con contenidos digitales interactivos.',
      coordinator: 'Coordinación de RA',
      focus: 'Experiencias inmersivas · Perfil temporal',
      members: Array.from({ length: 8 }, (_, index) => ({ name: 'Integrante RA ' + String(index + 1).padStart(2, '0'), role: index % 3 === 0 ? 'Profesor' : 'Estudiante' })),
      events: [
        { date: '2026-11-18', day: '18', month: 'Nov 2026', type: 'Encuentros', title: 'Laboratorio de experiencias inmersivas', description: 'Exploración de prototipos que combinan objetos físicos y contenido virtual.' },
        { date: '2026-10-09', day: '9', month: 'Oct 2026', type: 'Ponencias', title: 'Realidad aumentada en el aula', description: 'Presentación de experiencias interactivas para apoyar el aprendizaje.' },
        { date: '2026-08-21', day: '21', month: 'Ago 2026', type: 'Encuentros', title: 'Encuentro de diseño tridimensional', description: 'Intercambio de técnicas de modelado para experiencias aumentadas.' },
        { date: '2026-05-14', day: '14', month: 'May 2026', type: 'Congresos', title: 'Jornada de tecnologías inmersivas', description: 'Demostración de propuestas para acercar la realidad aumentada a la comunidad.' }
      ],
      projects: [
        { id: 1, title: 'Recorrido aumentado del campus', description: 'Prototipo para descubrir espacios universitarios con información virtual.', status: 'Activos' },
        { id: 2, title: 'Laboratorio de anatomía 3D', description: 'Visualización de modelos interactivos para acompañar la formación.', status: 'Activos' },
        { id: 3, title: 'Museo interactivo', description: 'Experiencia aumentada para explorar piezas y relatos culturales.', status: 'Finalizados' },
        { id: 4, title: 'Guía inmersiva de patrimonio', description: 'Propuesta de recorrido que conecta lugares con su historia.', status: 'Radicados' }
      ]
    },
    IA: {
      description: 'Estudiamos modelos de inteligencia artificial y análisis de datos para construir soluciones que apoyen a nuestra comunidad.',
      coordinator: 'Coordinación de IA',
      focus: 'Inteligencia artificial · Perfil temporal',
      members: Array.from({ length: 8 }, (_, index) => ({ name: 'Integrante IA ' + String(index + 1).padStart(2, '0'), role: index % 3 === 0 ? 'Profesor' : 'Estudiante' })),
      events: [
        { date: '2026-11-25', day: '25', month: 'Nov 2026', type: 'Encuentros', title: 'Encuentro de aprendizaje automático', description: 'Intercambio de experimentos y resultados de modelos de aprendizaje.' },
        { date: '2026-10-15', day: '15', month: 'Oct 2026', type: 'Ponencias', title: 'IA aplicada a la educación', description: 'Presentación de herramientas para acompañar procesos de aprendizaje.' },
        { date: '2026-09-03', day: '3', month: 'Sept 2026', type: 'Encuentros', title: 'Laboratorio de datos abiertos', description: 'Sesión práctica de exploración y preparación de conjuntos de datos.' },
        { date: '2026-06-11', day: '11', month: 'Jun 2026', type: 'Congresos', title: 'Jornada de inteligencia artificial responsable', description: 'Conversación sobre el uso responsable de modelos y sus resultados.' }
      ],
      projects: [
        { id: 1, title: 'Asistente académico inteligente', description: 'Prototipo de orientación sobre recursos y actividades universitarias.', status: 'Activos' },
        { id: 2, title: 'Clasificación de documentos', description: 'Exploración de modelos para organizar información por su contenido.', status: 'Activos' },
        { id: 3, title: 'Análisis de datos ambientales', description: 'Estudio de patrones en registros abiertos del entorno.', status: 'Finalizados' },
        { id: 4, title: 'Visión artificial para reciclaje', description: 'Propuesta de reconocimiento de materiales a partir de imágenes.', status: 'Radicados' }
      ]
    }
  };
  get currentContent() { return this.content[this.selectedSeedbed]; }
  get members() { return this.currentContent.members; }
  get events() { return this.currentContent.events; }
  get projects() { return this.currentContent.projects; }
  selectSeedbed(seedbed: typeof this.seedbeds[number]): void {
    this.selectedSeedbed = seedbed;
    this.memberOffset = 0;
    this.selectedStatus = 'Activos';
    this.selectedEventOrder = 'Más recientes';
    this.selectedDetail = null;
  }
  projectCount(status: string): number { return this.projects.filter(project => status === 'Todos' || project.status === status).length; }
  get filteredProjects() { return this.projects.filter(project => this.selectedStatus === 'Todos' || project.status === this.selectedStatus); }
  get filteredEvents() {
    const direction = this.selectedEventOrder === 'Más recientes' ? -1 : 1;
    return [...this.events].sort((first, second) => direction * first.date.localeCompare(second.date));
  }
  memberInitials(name: string): string { return name.split(' ').map(part => part[0]).join(''); }
  projectStatusLabel(status: string): string {
    return status === 'Activos' ? 'Activa' : status === 'Finalizados' ? 'Finalizada' : 'Radicada';
  }
  openDetails(dialog: HTMLDialogElement, item: { title: string; description: string }, kind: string, metadata: string): void {
    this.selectedDetail = { ...item, kind, metadata };
    dialog.showModal();
  }
  get visibleMembers() { return Array.from({ length: Math.min(4, this.members.length) }, (_, index) => this.members[(this.memberOffset + index) % this.members.length]); }
  moveMembers(direction: number): void { this.memberOffset = (this.memberOffset + direction + this.members.length) % this.members.length; }
}
