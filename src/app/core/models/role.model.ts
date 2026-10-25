export type UserRole = 'visitante' | 'estudiante' | 'docente' | 'admin';

export interface RoleDefinition {
  id: UserRole;
  label: string;
  description: string;
}

export const USER_ROLES: readonly RoleDefinition[] = [
  { id: 'visitante', label: 'Visitante', description: 'Consulta información pública.' },
  { id: 'estudiante', label: 'Estudiante', description: 'Participa en actividades y proyectos.' },
  { id: 'docente', label: 'Docente', description: 'Gestiona actividades académicas.' },
  { id: 'admin', label: 'Administrador', description: 'Administra la plataforma.' }
];

// Solo admite los cuatro roles del contrato; los valores desconocidos no otorgan acceso.
export function parseUserRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return USER_ROLES.find(role => role.id === normalized)?.id ?? null;
}
