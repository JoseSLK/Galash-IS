import { ChangeDetectionStrategy, Component, Input, OnChanges, output } from '@angular/core';
import {FormControl,ReactiveFormsModule,Validators} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ResearchProject } from './project.model';
@Component({selector:'app-project-detail',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[DatePipe,ReactiveFormsModule],templateUrl:'./project-detail.component.html',styleUrl:'./project-detail.component.css'})
export class ProjectDetailComponent implements OnChanges {
 @Input({required:true}) project!:ResearchProject; @Input() authenticated=false; @Input() showHistory=false; @Input() loginBusy=false;
 @Input() canEdit=false;@Input() progressBusy=false;@Input() progressError='';@Input() historyState:'loading'|'ready'|'error'='ready';
 readonly progressControl=new FormControl(0,{nonNullable:true,validators:[Validators.required,Validators.min(0),Validators.max(100),Validators.pattern(/^\d+$/)]});
 readonly saveProgress=output<number>();readonly retryHistory=output<void>();
 ngOnChanges():void{this.progressControl.setValue(this.project.progress);if(this.progressBusy)this.progressControl.disable();else this.progressControl.enable();}
 submitProgress():void{this.progressControl.markAsTouched();if(this.canEdit&&!this.progressBusy&&this.progressControl.valid)this.saveProgress.emit(this.progressControl.value);}
 readonly signIn=output<void>();
}
