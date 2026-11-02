import '@angular/compiler';
import {AuthService} from '../../core/services/auth.service';
import {Injector,runInInjectionContext} from '@angular/core';
import {describe,it,expect,vi} from 'vitest';
import {of,throwError} from 'rxjs';
import {ProjectsPageComponent} from './projects-page.component';
import {ProjectsService} from './projects.service';
import {ResearchProject} from './project.model';
const project=(id:string,status:ResearchProject['status'],seedbed:string):ResearchProject=>({id,status,seedbed,title:id,summary:'Example',researchLine:'Line',progress:20,responsible:[],memberInitials:[],startDate:'2026-01-01',endDate:'2026-12-01',updatedAt:'2026-10-01'});
function create(list:ReturnType<typeof vi.fn>){return runInInjectionContext(Injector.create({providers:[{provide:ProjectsService,useValue:{list}},{provide:AuthService,useValue:{backendUser:()=>({id:'member-1'})}}]}),()=>new ProjectsPageComponent());}
describe('Project catalogue state',()=>{
 it('combines filters and drops selected details outside the visible list',()=>{const page=create(vi.fn(()=>of([project('a','Activo','IA'),project('b','Radicado','WASI'),project('c','Finalizado','IA')])));expect(page.selected()?.id).toBe('a');page.selectedId.set('b');expect(page.selected()?.id).toBe('b');page.seedbed.set('IA');expect(page.filtered().map(item=>item.id)).toEqual(['a','c']);expect(page.selected()?.id).toBe('a');page.status.set('Finalizado');expect(page.count('Todos')).toBe(2);expect(page.selected()?.id).toBe('c');page.seedbed.set('WASI');expect(page.selected()).toBeNull();page.reset();expect(page.filtered()).toHaveLength(3);});
 it('personal view matches account IDs rather than names',()=>{const own={...project('own','Activo','IA'),members:[{userId:'member-1',name:'Persona'}]};const other={...project('other','Activo','IA'),members:[{userId:'someone-else',name:'Persona'}]};const responsible={...project('responsible','Activo','IA'),responsibleIds:['member-1']};const page=create(vi.fn(()=>of([own,other,responsible])));page.personal=true;expect(page.available().map(item=>item.id)).toEqual(['own','responsible']);});
 it('recovers from an error through retry',()=>{const page=create(vi.fn().mockReturnValueOnce(throwError(()=>new Error('offline'))).mockReturnValueOnce(of([])));expect(page.state()).toBe('error');page.load();expect(page.state()).toBe('ready');expect(page.selected()).toBeNull();});
});
