import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { parseUserRole, UserRole, USER_ROLES } from '../../../core/models/role.model';
import { FilaIntegrante } from '../../integrantes/integrantes-tabla.component';
import { Seedbed } from '../../seedbeds/seedbeds.service';

interface Vinculacion {
  userId: string; name: string; lastName: string; role: string; joinedAt: string; leftAt?: string;
}
interface Perfil {
  id: string; name: string; last_name: string; role: string; status: string; area?: string;
}
export interface CandidatoIntegrante { id: string; nombre: string; rol: UserRole | null; activo: boolean; }
export interface IntegranteAdmin extends FilaIntegrante {
  estado: 'activo' | 'inactivo'; rol: UserRole | null; joinedAt: string; leftAt?: string;
}
@Injectable()
export class IntegrantesAdminService {
  private readonly api = inject(ApiService);
  async buscar(query: string): Promise<CandidatoIntegrante[]> {
    const { users } = await this.api.get<{users: Perfil[] | null}>(`/admin/members?q=${encodeURIComponent(query.trim())}&limit=50`);
    return (users ?? []).map(user => ({id:user.id, nombre:[user.name,user.last_name].filter(Boolean).join(' '), rol:parseUserRole(user.role), activo:user.status==='activo'}));
  }
  vincular(semilleroId: string, userId: string): Promise<void> {
    return this.api.post<void,{userId:string}>(`/seedbeds/${encodeURIComponent(semilleroId)}/members`,{userId});
  }
  retirar(semilleroId: string, userId: string): Promise<void> {
    return this.api.delete(`/seedbeds/${encodeURIComponent(semilleroId)}/members/${encodeURIComponent(userId)}`);
  }
  async listar(semillero: Seedbed): Promise<IntegranteAdmin[]> {
    const { members } = await this.api.get<{members: Vinculacion[] | null}>(`/seedbeds/${encodeURIComponent(semillero.id)}/members?history=true`);
    return Promise.all((members ?? []).map(async member => {
      const profile = await this.api.get<Perfil>(`/members/${encodeURIComponent(member.userId)}`);
      const rol = parseUserRole(profile.role);
      return {
        id: member.userId, nombre: [profile.name, profile.last_name].filter(Boolean).join(' '),
        tipo: rol === 'docente' || rol === 'estudiante' ? rol : USER_ROLES.find(item => item.id === rol)?.label ?? '[Rol no disponible]',
        semilleros: [semillero.name], area: profile.area || '—', estado: profile.status === 'activo' ? 'activo' as const : 'inactivo' as const,
        rol, joinedAt: member.joinedAt, leftAt: member.leftAt
      };
    }));
  }
}
