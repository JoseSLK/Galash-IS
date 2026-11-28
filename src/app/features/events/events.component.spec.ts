import '@angular/compiler';
import {TestBed} from '@angular/core/testing';
import {describe,it,expect} from 'vitest';
import {EventsComponent} from './events.component';
import {PublicEvent,SeedbedsService} from '../seedbeds/seedbeds.service';
const day=86_400_000;
const event=(id:string,offset:number,seedbedId?:string):PublicEvent=>({id,title:id,description:'',type:'evento',status:'publicado',startAt:new Date(Date.now()+offset*day).toISOString(),seedbedId});
async function create(list:PublicEvent[]){
 TestBed.configureTestingModule({providers:[{provide:SeedbedsService,useValue:{publishedEvents:async()=>list}}]});
 const page=TestBed.runInInjectionContext(()=>new EventsComponent());
 await page.load();
 return page;
}
describe('Noticias general-interest split',()=>{
 it('separates events without seedbed into the general section',async()=>{
  const page=await create([event('news',5,'s1'),event('general-a',3),event('general-b',8),event('past',-4)]);
  expect(page.filtered().map(item=>item.id)).toEqual(['general-a','news','general-b']);
  expect(page.news().map(item=>item.id)).toEqual(['news']);
  expect(page.general().map(item=>item.id)).toEqual(['general-a','general-b']);
  expect(page.featured()?.id).toBe('news');
  expect(page.cards()).toHaveLength(0);
 });
 it('keeps the split under the past and all filters',async()=>{
  const page=await create([event('news',5,'s1'),event('past-general',-4),event('past-news',-6,'s1')]);
  page.filter.set('past');
  expect(page.news().map(item=>item.id)).toEqual(['past-news']);
  expect(page.general().map(item=>item.id)).toEqual(['past-general']);
  expect(page.featured()).toBeNull();
  page.filter.set('all');
  expect(page.news().map(item=>item.id)).toEqual(['past-news','news']);
  expect(page.general().map(item=>item.id)).toEqual(['past-general']);
 });
});
