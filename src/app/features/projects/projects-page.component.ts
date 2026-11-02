import {NgTemplateOutlet} from '@angular/common';
import {AuthService} from '../../core/services/auth.service';
import {ProjectEditorComponent} from './project-editor.component';
import { ChangeDetectionStrategy, Component, DestroyRef, Input, ViewChild, output, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { ProjectsService } from './projects.service';
import { PROJECT_LABELS, PROJECT_STATUSES, ProjectStatus, ResearchProject } from './project.model';
import { ProjectListComponent } from './project-list.component';
import { ProjectDetailComponent } from './project-detail.component';
@Component({selector:'app-projects-page',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,host:{'[class.embedded]':'embedded'},imports:[NgTemplateOutlet,ProjectEditorComponent,DashboardComponent,SiteFooterComponent,ProjectListComponent,ProjectDetailComponent],templateUrl:'./projects-page.component.html',styleUrl:'./projects-page.component.css'})
export class ProjectsPageComponent {
 @Input() embedded=false;@Input() management=false;@Input() personal=false;
 @ViewChild(DashboardComponent) private siteHeader?:DashboardComponent;
 readonly auth=inject(AuthService);readonly signIn=output<void>();readonly feedback=signal('');
 requestLogin():void {if(this.embedded)this.signIn.emit();else void this.siteHeader?.continueWithGoogle();}

 private readonly service=inject(ProjectsService);private readonly destroyRef=inject(DestroyRef);
 readonly state=signal<'loading'|'ready'|'error'>('loading');readonly projects=signal<ResearchProject[]>([]);
 readonly status=signal<ProjectStatus|'Todos'>('Todos');readonly seedbed=signal('Todos');readonly selectedId=signal('');
 readonly statuses=PROJECT_STATUSES;readonly labels=PROJECT_LABELS;
 readonly available=computed(()=>this.personal?this.projects().filter(project=>{const id=this.auth.backendUser()?.id;return !!id&&(project.members?.some(member=>member.userId===id)||project.responsibleIds?.includes(id));}):this.projects());
 readonly seedbeds=computed(()=>['Todos',...new Set(this.available().map(project=>project.seedbed))]);
 readonly inSeedbed=computed(()=>this.available().filter(project=>this.seedbed()==='Todos'||project.seedbed===this.seedbed()));
 readonly filtered=computed(()=>this.inSeedbed().filter(project=>this.status()==='Todos'||project.status===this.status()));
 readonly selected=computed(()=>this.filtered().find(project=>project.id===this.selectedId())??this.filtered()[0]??null);
 constructor(){this.load();}
 count(status:ProjectStatus|'Todos'):number {return this.inSeedbed().filter(project=>status==='Todos'||project.status===status).length;}
 load():void {this.state.set('loading');this.service.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:projects=>{this.projects.set(projects);this.state.set('ready');},error:()=>this.state.set('error')});}
 choose(id:string):void {this.selectedId.set(id);if(matchMedia('(max-width:900px)').matches)document.getElementById('project-detail')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 savedProject(project:ResearchProject):void {this.reset();this.selectedId.set(project.id);this.feedback.set('Proyecto guardado con fecha y autor.');}
 reset():void {this.status.set('Todos');this.seedbed.set('Todos');}
}
