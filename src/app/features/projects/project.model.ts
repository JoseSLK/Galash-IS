// Local presentation data for the HU-SEM-05 prototype; not an API payload.
export type ProjectStatus = 'Activo' | 'Radicado' | 'Finalizado';
export interface ProjectParticipant {userId:string;name:string;}
export interface ProjectUpdate {at:string;authorId:string;author:string;action:string;}
export type ProjectEdit = Pick<ResearchProject,'title'|'summary'|'seedbed'|'researchLine'|'responsible'|'startDate'|'endDate'|'status'|'progress'|'director'|'problem'|'objectives'|'methodology'|'attachments'> & {responsibleIds:string[];members:ProjectParticipant[]};
export interface ResearchProject {
 id: string; title: string; summary: string; seedbed: string; researchLine: string;
 status: ProjectStatus; progress: number; responsible: string[]; memberInitials: string[];
 director?:string; problem?:string; objectives?:string; methodology?:string; attachments?:File[];
 responsibleIds?:string[]; members?:ProjectParticipant[]; history?:ProjectUpdate[];
 startDate: string; endDate: string; updatedAt: string;
}
export const PROJECT_STATUSES: readonly ProjectStatus[] = ['Activo', 'Radicado', 'Finalizado'];
export const PROJECT_LABELS: Record<ProjectStatus,string> = {Activo:'Activos',Radicado:'Radicados',Finalizado:'Finalizados'};
