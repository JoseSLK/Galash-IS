import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LeaderService } from './leader.service';
import { RegistrationRequestsService } from '../admin/requests/registration-requests.service';

describe('LeaderService', () => {
  let service: LeaderService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(LeaderService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('only exposes semilleros actually directed by the authenticated user', async () => {
    const load = service.owned();
    http.expectOne('/api/users/me').flush({ id: 'leader', managed_seedbed_ids: ['own','delegated'] });
    await Promise.resolve();
    http.expectOne('/api/seedbeds/own').flush({ id: 'own', responsibleTeacherId: 'leader' });
    http.expectOne('/api/seedbeds/delegated').flush({ id: 'delegated', responsibleTeacherId: 'other' });
    await expect(load).resolves.toEqual([{ id: 'own', responsibleTeacherId: 'leader' }]);
  });
  it('never queries the directory when the search term is too short', async () => { await expect(service.candidates('a')).resolves.toEqual([]); });
  it('reports a lookup failure instead of claiming the user has no semilleros', async () => {
    const load = service.owned();
    http.expectOne('/api/users/me').flush({id:'leader',managed_seedbed_ids:['own']});
    await Promise.resolve();
    http.expectOne('/api/seedbeds/own').flush({}, {status:500,statusText:'Error'});
    await expect(load).rejects.toThrow('comprobar');
  });
  it('requests only the chosen semillero and rejects unrelated rows in the response', async () => {
    const requests = TestBed.inject(RegistrationRequestsService);
    const load = requests.load('own');
    http.expectOne('/api/admin/registration-requests?seedbedId=own').flush({requests:[{id:'a',seedbedId:'own'},{id:'b',seedbedId:'other'}]});
    await load; expect(requests.requests().map(item=>item.id)).toEqual(['a']);
  });
  it('preserves the other delegate when removing one', async () => {
    const save = service.delegate('own','a',false);
    http.expectOne('/api/seedbeds/own/members').flush({ members: [{ userId:'a',delegate:true },{ userId:'b',delegate:true }] });
    await Promise.resolve(); await Promise.resolve();
    const put = http.expectOne({ method:'PUT', url:'/api/seedbeds/own/delegates' });
    expect(put.request.body).toEqual({ userIds:['b'] }); put.flush(null,{status:204,statusText:'No Content'}); await save;
  });
  it('rejects a third delegate without a write', async () => {
    const save = service.delegate('own','c',true);
    http.expectOne('/api/seedbeds/own/members').flush({ members: [{userId:'a',delegate:true},{userId:'b',delegate:true},{userId:'c',delegate:false}] });
    await expect(save).rejects.toThrow('dos delegados');
  });
});
