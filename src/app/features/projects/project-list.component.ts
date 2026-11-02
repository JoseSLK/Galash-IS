import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { PROJECT_LABELS, PROJECT_STATUSES, ResearchProject } from './project.model';
@Component({selector:'app-project-list',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,template:`<div class="project-groups" aria-label="Proyectos por estado">@for(status of statuses;track status) {@if(group(status).length) {<section class="project-group" [attr.data-status]="status"><h2><span class="status-dot" aria-hidden="true"></span>{{labels[status]}} · {{group(status).length}}</h2>@for(project of group(status);track project.id) {<button type="button" class="project-item" [class.selected]="project.id===selectedId" [attr.aria-pressed]="project.id===selectedId" aria-controls="project-detail" (click)="selectProject.emit(project.id)"><strong>{{project.title}}</strong><span class="project-meta"><span>{{project.seedbed}}</span><span class="progress-track" aria-hidden="true"><span [style.width.%]="project.progress"></span></span><span>{{project.progress}}%</span></span></button>}</section>}}</div>`,styleUrl:'./project-list.component.css'})
export class ProjectListComponent {
 @Input() projects: ResearchProject[]=[]; @Input() selectedId='';
 readonly selectProject=output<string>(); readonly statuses=PROJECT_STATUSES; readonly labels=PROJECT_LABELS;
 group(status:ResearchProject['status']):ResearchProject[] {return this.projects.filter(project=>project.status===status);}
}
