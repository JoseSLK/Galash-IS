import {HttpErrorResponse} from '@angular/common/http';
import {NgTemplateOutlet} from '@angular/common';
import {AuthService} from '../../core/services/auth.service';
import {ProjectEditorComponent} from './project-editor.component';
import { ChangeDetectionStrategy, Component, DestroyRef, Input, ViewChild, output, effect, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { ProjectsService } from './projects.service';
import { PROJECT_LABELS, PROJECT_STATUSES, ProjectStatus, ProjectUpdate, ResearchProject } from './project.model';
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
 readonly baseSelected=computed(()=>this.filtered().find(project=>project.id===this.selectedId())??this.filtered()[0]??null);
 readonly canReadInternals=computed(()=>this.auth.hasRole('admin')||this.auth.hasRole('docente')||this.auth.hasRole('estudiante'));
 readonly historyState=signal<'loading'|'ready'|'error'>('ready');readonly progressBusy=signal(false);readonly progressError=signal('');
 readonly summaryOpen=signal(false);readonly summaryState=signal<'loading'|'ready'|'error'>('loading');readonly summary=signal<ResearchProject[]>([]);
 readonly summaryAverage=computed(()=>this.summary().length?Math.round(this.summary().reduce((sum,p)=>sum+p.progress,0)/this.summary().length):0);
 readonly detail=signal<ResearchProject|null>(null);readonly detailState=signal<'loading'|'ready'|'error'>('loading');
 readonly historyData=signal<{id:string;items:ProjectUpdate[]}>({id:'',items:[]});
 readonly selected=computed(()=>{const p=this.detail()?.id===this.baseSelected()?.id?this.detail():this.baseSelected();return p?{...p,history:this.historyData().id===p.id?this.historyData().items:[]}:null;});
 private detailRequest=0;private historyRequest=0;
 constructor(){this.destroyRef.onDestroy(()=>{this.detailRequest++;this.historyRequest++;});this.load();effect(()=>{const project=this.baseSelected();const internals=this.canReadInternals();if(project){void this.loadDetail(project.id);if(internals)void this.loadHistory(project.id);}});}
 canEdit(project:ResearchProject):boolean{return this.auth.isAdmin()||(this.auth.hasRole('docente')&&!!project.responsibleIds?.includes(this.auth.backendUser()?.id??''));}
 async loadDetail(id:string):Promise<void>{const request=++this.detailRequest;this.detailState.set('loading');this.progressError.set('');try{const project=await this.service.detail(id);if(request===this.detailRequest){this.detail.update(old=>({...project,history:old?.id===id?old.history:[]}));this.detailState.set('ready');}}catch{if(request===this.detailRequest)this.detailState.set('error');}}
 async loadHistory(id:string):Promise<void>{if(!this.canReadInternals())return;const request=++this.historyRequest;this.historyState.set('loading');try{const history=await this.service.history(id);if(request===this.historyRequest&&this.baseSelected()?.id===id){this.historyData.set({id,items:history});this.historyState.set('ready');}}catch{if(request===this.historyRequest)this.historyState.set('error');}}
 async saveProgress(progress:number):Promise<void>{const project=this.selected();if(!project||!this.canEdit(project)||this.progressBusy())return;this.progressBusy.set(true);this.progressError.set('');try{const updated=await this.service.setProgress(project.id,progress);this.projects.update(items=>items.map(p=>p.id===updated.id?updated:p));this.detail.set(updated);this.feedback.set('Avance guardado.');if(this.canReadInternals())void this.loadHistory(updated.id);if(this.summaryOpen())void this.loadSummary();}catch(error){this.progressError.set(error instanceof HttpErrorResponse&&error.status===403?'No tienes permiso para actualizar el avance.':'No se pudo guardar el avance. Inténtalo nuevamente.');}finally{this.progressBusy.set(false);}}
 async loadSummary():Promise<void>{if(!this.canReadInternals())return;this.summaryOpen.set(true);this.summaryState.set('loading');try{this.summary.set(await this.service.progressSummary());this.summaryState.set('ready');}catch{this.summaryState.set('error');}}
 count(status:ProjectStatus|'Todos'):number {return this.inSeedbed().filter(project=>status==='Todos'||project.status===status).length;}
 load():void {this.state.set('loading');this.service.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:projects=>{this.projects.set(projects);this.state.set('ready');},error:()=>this.state.set('error')});}
 choose(id:string):void {this.selectedId.set(id);if(matchMedia('(max-width:900px)').matches)document.getElementById('project-detail')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 savedProject(project:ResearchProject):void {this.reset();this.selectedId.set(project.id);this.projects.update(items=>[...items.filter(p=>p.id!==project.id),project]);this.detail.set(project);this.feedback.set('Proyecto guardado.');void this.loadDetail(project.id);if(this.canReadInternals())void this.loadHistory(project.id);if(this.summaryOpen())void this.loadSummary();}
 reset():void {this.status.set('Todos');this.seedbed.set('Todos');}
}
