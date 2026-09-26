export type UserRole = 'visitante' | 'solicitante' | 'estudiante' | 'profesor' | 'coordinador' | 'administrador';

export interface RoleDefinition {
  id: UserRole;
  label: string;
  description: string;
}

export const USER_ROLES: readonly RoleDefinition[] = [
  { id: 'visitante', label: 'Visitante', description: 'Consulta información pública.' },
  { id: 'solicitante', label: 'Solicitante', description: 'Tiene una solicitud de registro en revisión.' },
  { id: 'estudiante', label: 'Estudiante', description: 'Participa en actividades y proyectos.' },
  { id: 'profesor', label: 'Profesor', description: 'Gestiona actividades académicas.' },
  { id: 'coordinador', label: 'Coordinador', description: 'Coordina procesos y equipos.' },
  { id: 'administrador', label: 'Administrador', description: 'Administra la plataforma.' }
];
