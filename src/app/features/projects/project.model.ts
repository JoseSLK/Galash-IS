// Presentation model mapped from the Projects API.
export type ProjectStatus = 'Activo' | 'Radicado' | 'Finalizado';
export interface ProjectParticipant {userId:string;name:string;}
export interface ProjectUpdate {at:string;authorId:string;author:string;action:string;}
export interface ProjectEdit {title:string;summary:string;seedbedId:string;researchLine:string;responsibleIds:string[];memberIds:string[];startDate:string;endDate:string;status:ProjectStatus;progress:number;}
export interface ResearchProject {
 id: string; seedbedId?:string; title: string; summary: string; seedbed: string; researchLine: string;
 status: ProjectStatus; progress: number; responsible: string[]; memberInitials: string[];
 director?:string;
 responsibleIds?:string[]; members?:ProjectParticipant[]; history?:ProjectUpdate[];
 startDate: string; endDate: string; updatedAt: string;
}
export const PROJECT_STATUSES: readonly ProjectStatus[] = ['Activo', 'Radicado', 'Finalizado'];
export const PROJECT_LABELS: Record<ProjectStatus,string> = {Activo:'Activos',Radicado:'Radicados',Finalizado:'Finalizados'};

export interface ProjectApi {
 id:string;seedbedId:string;title:string;summary:string;researchLine:string;status:ProjectStatus;
 responsibleIds:string[]|null;memberIds:string[]|null;startDate:string|null;endDate:string|null;progress:number;updatedAt:string;
}
