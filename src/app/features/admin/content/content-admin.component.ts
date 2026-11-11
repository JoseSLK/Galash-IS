import {ChangeDetectionStrategy,Component,OnInit,computed,inject,signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {NonNullableFormBuilder,ReactiveFormsModule,ValidatorFn,Validators} from '@angular/forms';
import {AuthService} from '../../../core/services/auth.service';
import {InstitutionalContentService} from '../../../core/services/institutional-content.service';
import {ContentPage,OfficialLink,LinkCategory,LinkStatus,LINK_CATEGORIES,officialUrl,publicLink} from '../../../core/models/institutional.model';
const requiredText:ValidatorFn=control=>String(control.value).trim()?null:{required:true};
const validUrl:ValidatorFn=control=>officialUrl(String(control.value))?null:{url:true};
@Component({selector:'app-content-admin',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[ReactiveFormsModule,DatePipe],templateUrl:'./content-admin.component.html',styleUrl:'./content-admin.component.css'})
export class ContentAdminComponent implements OnInit {
 private readonly service=inject(InstitutionalContentService);private readonly auth=inject(AuthService);private readonly fb=inject(NonNullableFormBuilder);
 readonly tab=signal<'pages'|'links'>('pages');readonly saving=signal(false);readonly error=signal('');readonly feedback=signal('');
 readonly pages=signal<ContentPage[]>([]);readonly links=signal<OfficialLink[]>([]);readonly pagesLoading=signal(true);readonly linksLoading=signal(true);readonly pagesError=signal('');readonly linksError=signal('');
 readonly pageId=signal<string|null>(null);readonly linkId=signal<string|null>(null);readonly pageOpen=signal(false);readonly linkOpen=signal(false);
 readonly selectedPage=computed(()=>this.pages().find(p=>p.id===this.pageId()));readonly selectedLink=computed(()=>this.links().find(p=>p.id===this.linkId()));
 readonly publishedCount=computed(()=>this.pages().filter(p=>p.status==='publicado').length);readonly visibleLinks=computed(()=>this.links().filter(publicLink).length);readonly missingUrls=computed(()=>this.links().filter(p=>!officialUrl(p.url)).length);
 readonly categories=LINK_CATEGORIES;readonly safeUrl=officialUrl;
 readonly pageForm=this.fb.group({title:['',[requiredText]],slug:['',[requiredText,Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],content:['',[requiredText]]});
 readonly linkForm=this.fb.group({name:['',[requiredText]],description:['',[requiredText]],url:['',[requiredText,validUrl]],category:this.fb.control<LinkCategory>('redes-sociales'),visible:[true],order:[0,[Validators.required,Validators.min(0),Validators.pattern(/^\d+$/)]]});
 ngOnInit():void{void this.loadPages();void this.loadLinks();}
 async loadPages():Promise<void>{this.pagesLoading.set(true);this.pagesError.set('');try{const items=await this.service.pages(true);this.pages.set(items);if(!this.pageOpen()&&items.length)this.putPage(items[0]);}catch(e){this.pagesError.set(this.message(e,'No pudimos cargar las secciones.'));}finally{this.pagesLoading.set(false);}}
 async loadLinks():Promise<void>{this.linksLoading.set(true);this.linksError.set('');try{const items=await this.service.links();this.links.set(items);if(!this.linkOpen()&&items.length)this.putLink(items[0]);}catch(e){this.linksError.set(this.message(e,'No pudimos cargar los enlaces.'));}finally{this.linksLoading.set(false);}}
 private canLeave():boolean{return !this.saving()&&(!(this.tab()==='pages'?this.pageForm.dirty:this.linkForm.dirty)||window.confirm('Tienes cambios sin guardar. ¿Quieres descartarlos?'));}
 changeTab(tab:'pages'|'links'):void{if(tab===this.tab()||!this.canLeave())return;if(this.tab()==='pages'){const selected=this.selectedPage();if(selected)this.pageForm.reset({title:selected.title,slug:selected.slug,content:selected.content});else this.pageForm.reset();}else{const selected=this.selectedLink();if(selected)this.fillLink(selected);else this.linkForm.reset();}this.tab.set(tab);this.clearMessages();}
 private clearMessages():void{this.error.set('');this.feedback.set('');}
 openPage(page?:ContentPage):void{if(!this.canLeave())return;this.pageId.set(page?.id??null);this.pageOpen.set(true);this.pageForm.reset({title:page?.title??'',slug:page?.slug??'',content:page?.content??''});this.clearMessages();}
 openLink(link?:OfficialLink):void{if(!this.canLeave())return;this.linkId.set(link?.id??null);this.linkOpen.set(true);this.linkForm.reset({name:link?.name??'',description:link?.description??'',url:link?.url??'',category:link?.category??'redes-sociales',visible:link?.visible??true,order:link?.order??(Math.max(-1,...this.links().map(item=>item.order))+1)});this.clearMessages();}
 updateSlug(title=this.pageForm.controls.title.value):void{if(!this.pageId()&&!this.pageForm.controls.slug.dirty){const slug=title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');this.pageForm.controls.slug.setValue(slug);}}
 private putPage(page:ContentPage):void{this.pages.update(items=>[...items.filter(p=>p.id!==page.id),page].sort((a,b)=>a.title.localeCompare(b.title,'es')));this.pageId.set(page.id);this.pageOpen.set(true);this.pageForm.reset({title:page.title,slug:page.slug,content:page.content});}
 async savePage(publish=false):Promise<void>{
  if(this.saving()||!this.auth.isAdmin())return;this.pageForm.markAllAsTouched();if(this.pageForm.invalid){this.error.set('Completa el título, el contenido y una dirección válida.');return;}
  const v=this.pageForm.getRawValue();this.saving.set(true);this.clearMessages();let stored=false;
  try{let page=this.selectedPage();if(!page||this.pageForm.dirty||!publish){page=await this.service.savePage({title:v.title.trim(),slug:v.slug.trim(),content:v.content.trim()},this.pageId()??undefined);this.putPage(page);stored=true;}
   if(publish&&page.status!=='publicado'){page=await this.service.publish(page.id);this.putPage(page);}
   this.feedback.set(publish?'Sección publicada. Ya está visible en Nosotros.':page.status==='publicado'?'Cambios guardados y visibles en Nosotros.':'Borrador guardado. Publícalo cuando esté listo.');
  }catch(e){this.error.set((stored&&publish?'Los cambios se guardaron, pero no se pudo publicar. ':'')+this.message(e,'No pudimos guardar la sección. Tus cambios siguen en el formulario.'));}finally{this.saving.set(false);}
 }
 private fillLink(link:OfficialLink):void{this.linkForm.reset({name:link.name,description:link.description,url:link.url,category:link.category,visible:link.visible,order:link.order});}
 private putLink(link:OfficialLink):void{this.links.update(items=>[...items.filter(p=>p.id!==link.id),link].sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name,'es')));this.linkId.set(link.id);this.linkOpen.set(true);this.fillLink(link);}
 async saveLink():Promise<void>{if(this.saving()||!this.auth.isAdmin())return;this.linkForm.markAllAsTouched();if(this.linkForm.invalid){this.error.set('Completa los datos y usa una URL con http:// o https:// y un orden entero no negativo.');return;}const v=this.linkForm.getRawValue();this.saving.set(true);this.clearMessages();try{this.putLink(await this.service.saveLink({...v,name:v.name.trim(),description:v.description.trim(),url:v.url.trim(),order:Number(v.order)},this.linkId()??undefined));this.feedback.set('Enlace guardado.');}catch(e){this.error.set(this.message(e,'No pudimos guardar el enlace. Tus cambios siguen en el formulario.'));}finally{this.saving.set(false);}}
 async setLinkStatus(status:LinkStatus):Promise<void>{const link=this.selectedLink();if(!link||this.saving()||!this.auth.isAdmin())return;if(this.linkForm.dirty){this.error.set('Guarda los cambios del enlace antes de cambiar su estado.');return;}this.saving.set(true);this.clearMessages();try{this.putLink(await this.service.linkStatus(link.id,status));this.feedback.set(status==='activo'?'Enlace activado y visible.':status==='oculto'?'Enlace oculto al público.':'Enlace desactivado.');}catch(e){this.error.set(this.message(e,'No pudimos cambiar el estado del enlace.'));}finally{this.saving.set(false);}}
 linkLabel(link:OfficialLink):string{return publicLink(link)?'Visible':link.status==='inactivo'?'Inactivo':'Oculto';}
 categoryLabel(value:LinkCategory):string{return this.categories.find(p=>p.value===value)?.label??value;}
 private message(e:unknown,fallback:string):string{if(!(e instanceof HttpErrorResponse))return fallback;return e.status===401?'Tu sesión venció. Inicia sesión de nuevo.':e.status===403?'Esta acción requiere permisos de administrador.':e.status===404?'El registro ya no existe. Actualiza la lista.':e.status===409?'Esa dirección ya está en uso o el estado cambió. Revisa los datos.':e.status===400?'El servidor rechazó los datos. Revisa los campos antes de guardar.':fallback;}
}
