import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface Seedbed {
  id: string;
  name: string;
  description: string;
  researchLine: string;
  objective: string;
  topics: SeedbedTopic[] | null;
}

export interface SeedbedTopic { title: string; phrase: string; }

// RA, IA from multi-word names; the first 5 letters for one word (CIBER).
export function seedbedAbbreviation(name: string): string {
  const words = name.trim().split(/\s+/).filter(word => word.length > 2);
  return (words.length > 1 ? words.map(word => word[0]).join('') : (words[0] ?? name).slice(0, 5)).toUpperCase();
}

export interface SeedbedSpace {
  seedbed: Seedbed;
  purpose: string;
  responsible: { id: string; name: string; lastName: string };
}

export interface SeedbedMember {
  userId: string;
  name: string;
  lastName: string;
  role: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  status: string;
  date: string | null;
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  status: 'Radicado' | 'Activo' | 'Finalizado';
}

@Injectable({ providedIn: 'root' })
export class SeedbedsService {
  private readonly api = inject(ApiService);

  async list(): Promise<Seedbed[]> {
    return (await this.api.get<{ seedbeds: Seedbed[] | null }>('/seedbeds')).seedbeds ?? [];
  }

  space(id: string): Promise<SeedbedSpace> {
    return this.api.get<SeedbedSpace>(`/seedbeds/${encodeURIComponent(id)}/space`);
  }

  async members(id: string): Promise<SeedbedMember[]> {
    return (await this.api.get<{ members: SeedbedMember[] | null }>(`/seedbeds/${encodeURIComponent(id)}/members`)).members ?? [];
  }

  async activities(id: string): Promise<Activity[]> {
    return (await this.api.get<{ activities: Activity[] | null }>(`/seedbeds/${encodeURIComponent(id)}/activities`)).activities ?? [];
  }

  async projects(seedbedId: string): Promise<Project[]> {
    return (await this.api.get<{ projects: Project[] | null }>(`/projects?seedbedId=${encodeURIComponent(seedbedId)}`)).projects ?? [];
  }
}
