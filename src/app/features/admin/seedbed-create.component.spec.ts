import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SeedbedCreateComponent } from './seedbed-create.component';

describe('SeedbedCreateComponent', () => {
  let http: HttpTestingController;
  let component: SeedbedCreateComponent;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(() => new SeedbedCreateComponent());
    component.ngOnInit();
    http.expectOne('/api/admin/members').flush({ users: [{ id: 't1', name: 'Ana', last_name: 'Gómez', role: 'docente', status: 'activo' }] });
    await new Promise(resolve => setTimeout(resolve));
  });

  afterEach(() => http.verify());

  const fill = () => component.form.patchValue({ name: ' IA ', researchLine: 'Inteligencia', description: 'Desc', objective: 'Obj', responsibleTeacherId: 't1', contactEmail: 'ia@example.test' });

  it('does not send an incomplete form', async () => {
    await component.save();
    http.expectNone({ method: 'POST', url: '/api/seedbeds' });
    expect(component.error()).toContain('obligatorios');
  });

  it('sends trimmed fields and topics, then resets', async () => {
    fill();
    component.addTopic();
    component.form.controls.topics.at(0).patchValue({ title: ' Visión ', phrase: '' });
    const save = component.save();
    const request = http.expectOne({ method: 'POST', url: '/api/seedbeds' });
    expect(request.request.body).toEqual({ name: 'IA', researchLine: 'Inteligencia', description: 'Desc', objective: 'Obj', responsibleTeacherId: 't1', contactEmail: 'ia@example.test', topics: [{ title: 'Visión', phrase: '' }] });
    request.flush({ id: 's1', status: 'Borrador' });
    await save;
    expect(component.created()).toEqual({ name: 'IA', teacher: 'Ana Gómez' });
    expect(component.form.controls.name.value).toBe('');
    expect(component.form.controls.topics.length).toBe(0);
  });

  it('caps topics at four and explains duplicate names', async () => {
    for (let i = 0; i < 6; i++) component.addTopic();
    expect(component.form.controls.topics.length).toBe(4);
    component.form.controls.topics.clear();
    fill();
    const save = component.save();
    http.expectOne({ method: 'POST', url: '/api/seedbeds' }).flush({ error: 'duplicado' }, { status: 409, statusText: 'Conflict' });
    await save;
    expect(component.error()).toBe('Ya existe un semillero con ese nombre.');
  });
});
