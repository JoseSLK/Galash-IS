import { Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AssignmentMember } from '../admin/seedbed-assignments.service';
import { LeaderActivity, LeaderSeedbed, LeaderService, MemberCandidate } from './leader.service';

@Component({ selector: 'app-leader-tools', standalone: true, imports: [ReactiveFormsModule, DatePipe], templateUrl: './leader-tools.component.html', styleUrl: '../admin/events/events-admin.component.css' })
export class LeaderToolsComponent {
  readonly seedbed = input.required<LeaderSeedbed>();
  readonly section = input.required<string>();
  private readonly service = inject(LeaderService);
  readonly loading = signal(false); readonly busy = signal(false); readonly error = signal(''); readonly feedback = signal('');
  readonly current = signal<LeaderSeedbed | null>(null);
  readonly members = signal<AssignmentMember[]>([]); readonly candidates = signal<MemberCandidate[]>([]);
  readonly activities = signal<LeaderActivity[]>([]); readonly editing = signal<LeaderActivity | null>(null);
  readonly query = new FormControl('', { nonNullable: true });
  readonly form = new FormGroup({ name: new FormControl('', { nonNullable: true, validators: [Validators.required] }), description: new FormControl('', { nonNullable: true, validators: [Validators.required] }), researchLine: new FormControl('', { nonNullable: true, validators: [Validators.required] }), objective: new FormControl('', { nonNullable: true, validators: [Validators.required] }), contactEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }) });
  readonly activityForm = new FormGroup({ title: new FormControl('', { nonNullable: true, validators: [Validators.required] }), description: new FormControl('', { nonNullable: true }), status: new FormControl('próxima', { nonNullable: true }), date: new FormControl('', { nonNullable: true }) });
  private requestId = 0;
  constructor() { effect(() => { this.seedbed(); this.section(); void this.load(); }); }
  async load(): Promise<void> {
    const request = ++this.requestId; const id = this.seedbed().id; const section = this.section();
    this.loading.set(true); this.error.set(''); this.feedback.set(''); this.candidates.set([]); this.query.reset();
    try {
      if (section === 'seedbed') { const s = await this.service.detail(id); if (request !== this.requestId) return; this.current.set(s); this.form.reset(s); }
      if (section === 'members') { const items = await this.service.members(id); if (request !== this.requestId) return; this.members.set(items.filter(item => !item.leftAt)); }
      if (section === 'activities') { const items = await this.service.activities(id); if (request !== this.requestId) return; this.activities.set(items.filter(item => item.seedbedId === id)); this.newActivity(); }
    } catch { if (request === this.requestId) this.error.set('No se pudo cargar esta sección de tu semillero. Inténtalo de nuevo.'); }
    finally { if (request === this.requestId) this.loading.set(false); }
  }
  private async run(action: () => Promise<unknown>, message: string): Promise<void> {
    if (this.busy()) return; this.busy.set(true); this.error.set(''); this.feedback.set('');
    try { await action(); this.feedback.set(message); }
    catch (error: unknown) { this.error.set(error instanceof HttpErrorResponse ? [401,403].includes(error.status) ? 'Tu sesión no tiene permiso para gestionar este semillero.' : 'No se pudo guardar el cambio. Revisa los datos e inténtalo de nuevo.' : error instanceof Error ? error.message : 'No se pudo guardar el cambio.'); }
    finally { this.busy.set(false); }
  }
  async saveSeedbed(): Promise<void> {
    this.form.markAllAsTouched(); if (this.form.invalid) { this.error.set('Completa los datos y un correo de contacto válido.'); return; }
    const value = this.form.getRawValue();
    await this.run(async () => { this.current.set(await this.service.update(this.seedbed().id, Object.fromEntries(Object.entries(value).map(([key,val]) => [key,val.trim()])) as typeof value)); this.form.markAsPristine(); }, 'Datos del semillero guardados.');
  }
  async visibility(status: string): Promise<void> { await this.run(async () => { this.current.set(await this.service.visibility(this.seedbed().id, status)); }, 'Visibilidad del semillero actualizada.'); }
  async searchMembers(): Promise<void> { if (this.query.value.trim().length < 2) { this.candidates.set([]); this.error.set('Escribe al menos dos caracteres del nombre.'); return; } await this.run(async () => { this.candidates.set(await this.service.candidates(this.query.value)); }, 'Búsqueda completada. Solo se muestran perfiles públicos activos con rol estudiante o docente.'); }
  hasMember(id: string): boolean { return this.members().some(item => item.userId === id); }
  async addMember(id: string): Promise<void> { await this.run(async () => { await this.service.addMember(this.seedbed().id,id); this.members.set(await this.service.members(this.seedbed().id)); }, 'Integrante vinculado al semillero.'); }
  async removeMember(id: string): Promise<void> { await this.run(async () => { await this.service.removeMember(this.seedbed().id,id); this.members.set(await this.service.members(this.seedbed().id)); }, 'Integrante retirado del semillero. Su cuenta y el historial se conservan.'); }
  async delegate(member: AssignmentMember): Promise<void> { await this.run(async () => { await this.service.delegate(this.seedbed().id,member.userId,!member.delegate); this.members.set(await this.service.members(this.seedbed().id)); }, 'Delegados actualizados.'); }
  newActivity(): void { this.editing.set(null); this.activityForm.reset({ title: '', description: '', status: 'próxima', date: '' }); }
  async editActivity(id: string): Promise<void> { await this.run(async () => { const item = await this.service.activity(id); if (item.seedbedId !== this.seedbed().id) throw new Error('La actividad no pertenece a este semillero.'); this.editing.set(item); this.activityForm.reset({ title: item.title, description: item.description, status: item.status, date: item.date?.slice(0,10) ?? '' }); }, 'Actividad lista para editar.'); }
  async saveActivity(): Promise<void> {
    this.activityForm.markAllAsTouched(); if (this.activityForm.invalid || !this.activityForm.controls.title.value.trim()) { this.error.set('Escribe el título de la actividad.'); return; }
    await this.run(async () => {
      const value = this.activityForm.getRawValue(); const existing = this.editing();
      const item = await this.service.saveActivity(this.seedbed().id, { title: value.title.trim(), description: value.description.trim(), status: value.status, date: value.date ? new Date(value.date+'T12:00:00').toISOString() : null, responsibleIds: existing?.responsibleIds ?? [], evidence: existing?.evidence ?? [] }, existing?.id);
      this.activities.update(items => existing ? items.map(old => old.id === item.id ? item : old) : [item,...items]); this.newActivity();
    }, 'Actividad guardada en tu semillero.');
  }
}
