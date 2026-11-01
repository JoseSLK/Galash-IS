import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { LETRAS_GALASH } from './hero-acronimo.data';
@Component({selector:'app-hero-acronimo',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./hero-acronimo.component.html',styleUrls:['./hero-acronimo.component.css']})
export class HeroAcronimoComponent implements OnInit, OnDestroy {
 @Input() logoUrl='';
 readonly letras=LETRAS_GALASH;
 readonly selected=signal(1); readonly paused=signal(false); readonly hovered=signal(false); readonly focused=signal(false); readonly manual=signal(false);
 readonly actual=computed(()=>this.letras[this.selected()]);
 readonly running=computed(()=>!this.paused()&&!this.hovered()&&!this.focused());
 private timer?:Subscription;
 private motion?:MediaQueryList;
 ngOnInit():void {this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.paused.set(this.motion.matches);this.motion.addEventListener('change',this.onMotion);this.sync();}
 choose(index:number):void {this.selected.set(index);this.manual.set(true);this.sync();}
 toggle():void {this.paused.update(value=>!value);this.sync();}
 hover(value:boolean):void {this.hovered.set(value);this.sync();}
 focusIn():void {this.focused.set(true);this.sync();}
 focusOut(event:FocusEvent):void {const current=event.currentTarget as HTMLElement;if(current.contains(event.relatedTarget as Node|null))return;this.focused.set(false);this.sync();}
 private readonly onMotion=(event:MediaQueryListEvent):void=>{this.paused.set(event.matches);this.sync();};
 private sync():void {this.timer?.unsubscribe();if(this.running())this.timer=interval(3000).subscribe(()=>{this.manual.set(false);this.selected.update(index=>(index+1)%this.letras.length);});}
 ngOnDestroy():void {this.timer?.unsubscribe();this.motion?.removeEventListener('change',this.onMotion);}
}
