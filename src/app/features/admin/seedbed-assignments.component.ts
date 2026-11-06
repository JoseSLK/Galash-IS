import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DirectoryPerson } from '../../shared/components/people-directory/person-directory.model';
import { AssignmentMember, AssignmentSeedbed, SeedbedAssignmentsService } from './seedbed-assignments.service';

@Component({
  selector: 'app-seedbed-assignments', standalone: true,
  templateUrl: './seedbed-assignments.component.html',
  styleUrl: './seedbed-assignments.component.css'
})
export class SeedbedAssignmentsComponent {
  readonly person = input.required<DirectoryPerson>();
  private readonly service = inject(SeedbedAssignmentsService);
  readonly seedbeds = signal<AssignmentSeedbed[]>([]);
  readonly seedbedId = signal('');
  readonly current = signal<AssignmentSeedbed | null>(null);
  readonly members = signal<AssignmentMember[]>([]);
  readonly loadingList = signal(true);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly feedback = signal('');
  readonly choice = signal<'' | 'leader' | 'delegate'>('');
  private requestId = 0;
  readonly isLeader = computed(() => this.current()?.responsibleTeacherId === this.person().id);
  readonly isDelegate = computed(() => this.members().some(member => member.userId === this.person().id && member.delegate));
  readonly delegates = computed(() => this.members().filter(member => member.delegate));
  readonly canLead = computed(() => this.person().status === 'active' && this.person().role === 'docente');
  readonly canDelegate = computed(() => this.person().status === 'active'
    && ['docente', 'estudiante'].includes(this.person().role)
    && this.members().some(member => member.userId === this.person().id)
    && (this.isDelegate() || this.delegates().length < 2));
  readonly canSave = computed(() => !!this.current() && !this.loading() && !this.saving()
    && (this.choice() === 'leader' ? this.canLead() && !this.isLeader()
      : this.choice() === 'delegate' && this.canDelegate() && !this.isDelegate()));

  constructor() {
    void this.loadList();
    effect(() => {
      this.person();
      const id = this.seedbedId();
      this.choice.set('');
      this.feedback.set('');
      void this.loadDetails(id);
    });
  }
  async loadList(): Promise<void> {
    this.loadingList.set(true);
    this.error.set('');
    try { this.seedbeds.set(await this.service.list()); }
    catch { this.error.set('No se pudieron cargar los semilleros. Inténtalo de nuevo.'); }
    finally { this.loadingList.set(false); }
  }
  async loadDetails(id: string): Promise<void> {
    const request = ++this.requestId;
    this.current.set(null);
    this.members.set([]);
    this.error.set('');
    this.loading.set(!!id);
    if (!id) return;
    try {
      const [seedbed, members] = await Promise.all([this.service.detail(id), this.service.members(id)]);
      if (request !== this.requestId) return;
      this.current.set(seedbed);
      this.members.set(members);
    } catch {
      if (request === this.requestId) this.error.set('No se pudo consultar el semillero. Vuelve a seleccionarlo.');
    } finally { if (request === this.requestId) this.loading.set(false); }
  }
  async save(): Promise<void> {
    if (!this.canSave()) return;
    const person = this.person();
    const id = this.seedbedId();
    const choice = this.choice();
    this.saving.set(true);
    this.error.set('');
    this.feedback.set('');
    try {
      if (choice === 'leader') await this.service.assignLeader(id, person.id);
      else await this.service.assignDelegate(id, person.id);
      if (this.person().id !== person.id || this.seedbedId() !== id) return;
      await this.loadDetails(id);
      this.choice.set('');
      this.feedback.set(`Se asignó a ${person.name} como ${choice === 'leader' ? 'líder' : 'delegado'} del semillero.`);
    } catch (error: unknown) {
      if (this.person().id !== person.id || this.seedbedId() !== id) return;
      this.error.set(error instanceof HttpErrorResponse
        ? error.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
          : error.status === 403 ? 'No tienes permiso para asignar esta función.'
          : error.status === 400 ? 'La asignación no es válida. Revisa el rol, los integrantes y el límite de delegados.'
          : 'No se pudo guardar la función. Inténtalo de nuevo.'
        : error instanceof Error ? error.message : 'No se pudo guardar la función.');
    } finally { this.saving.set(false); }
  }
}
