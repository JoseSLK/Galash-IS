import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ResearchProject } from './project.model';
@Component({selector:'app-project-detail',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[DatePipe],templateUrl:'./project-detail.component.html',styleUrl:'./project-detail.component.css'})
export class ProjectDetailComponent {
 @Input({required:true}) project!:ResearchProject; @Input() authenticated=false; @Input() showHistory=false; @Input() loginBusy=false;
 readonly signIn=output<void>();
}
