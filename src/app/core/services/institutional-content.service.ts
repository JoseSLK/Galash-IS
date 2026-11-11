import {Injectable,inject} from '@angular/core';
import {ApiService} from './api.service';
import {ContentPage,PageInput,OfficialLink,LinkInput,LinkStatus,publicLink} from '../models/institutional.model';
@Injectable({providedIn:'root'})
export class InstitutionalContentService {
 private readonly api=inject(ApiService);
 async pages(admin=false):Promise<ContentPage[]>{return (await this.api.get<{pages:ContentPage[]|null}>(admin?'/admin/content/pages':'/content/pages')).pages??[];}
 savePage(body:PageInput,id?:string):Promise<ContentPage>{return id?this.api.patch(`/admin/content/pages/${encodeURIComponent(id)}`,body):this.api.post('/admin/content/pages',body);}
 publish(id:string):Promise<ContentPage>{return this.api.post(`/admin/content/pages/${encodeURIComponent(id)}/publish`,{});}
 async links(publicView=false):Promise<OfficialLink[]>{const links=(await this.api.get<{links:OfficialLink[]|null}>('/links')).links??[];return (publicView?links.filter(publicLink):links).sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name,'es'));}
 saveLink(body:LinkInput,id?:string):Promise<OfficialLink>{return id?this.api.patch(`/links/${encodeURIComponent(id)}`,body):this.api.post('/links',body);}
 linkStatus(id:string,status:LinkStatus):Promise<OfficialLink>{return this.api.patch(`/links/${encodeURIComponent(id)}/status`,{status});}
}
