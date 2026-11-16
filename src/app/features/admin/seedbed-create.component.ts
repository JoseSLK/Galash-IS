import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FieldErrorDirective } from '../../shared/field-error.directive';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NewSeedbed, SeedbedAssignmentsService, TeacherOption } from './seedbed-assignments.service';

const MAX_TOPICS = 4;
const text = (validators = [Validators.required]) => new FormControl('', { nonNullable: true, validators });
const topic = () => new FormGroup({ title: text([Validators.required, Validators.maxLength(60)]), phrase: text([Validators.maxLength(160)]) });

@Component({
  selector: 'app-seedbed-create', standalone: true, imports: [ReactiveFormsModule, FieldErrorDirective],
  templateUrl: './seedbed-create.component.html',
  styleUrl: './seedbed-create.component.css'
})
export class SeedbedCreateComponent implements OnInit {
  private readonly service = inject(SeedbedAssignmentsService);
  readonly maxTopics = MAX_TOPICS;
  readonly teachers = signal<TeacherOption[]>([]);
  readonly teachersError = signal('');
  readonly saving = signal(false);
  readonly error = signal('');
  readonly created = signal<{ name: string; teacher: string } | null>(null);
  readonly form = new FormGroup({
    name: text([Validators.required, Validators.maxLength(120)]),
    researchLine: text(),
    description: text(),
    objective: text(),
    responsibleTeacherId: text(),
    contactEmail: text([Validators.required, Validators.email]),
    topics: new FormArray<ReturnType<typeof topic>>([])
  });

  ngOnInit(): void { void this.loadTeachers(); }

  async loadTeachers(): Promise<void> {
    this.teachersError.set('');
    try {
      this.teachers.set(await this.service.teachers());
      if (!this.teachers().length) this.teachersError.set('No hay docentes activos. Asigna el rol Docente en Usuarios y roles antes de crear un semillero.');
    } catch { this.teachersError.set('No pudimos cargar los docentes.'); }
  }

  addTopic(): void { if (this.form.controls.topics.length < MAX_TOPICS) this.form.controls.topics.push(topic()); }
  removeTopic(index: number): void { this.form.controls.topics.removeAt(index); }

  async save(): Promise<void> {
    if (this.saving()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error.set('Completa los campos obligatorios y revisa el correo de contacto.'); return; }
    this.saving.set(true); this.error.set(''); this.created.set(null);
    const { topics, ...fields } = this.form.getRawValue();
    const body: NewSeedbed = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim()])) as unknown as NewSeedbed;
    if (topics.length) body.topics = topics.map(item => ({ title: item.title.trim(), phrase: item.phrase.trim() }));
    try {
      await this.service.create(body);
      this.created.set({ name: body.name, teacher: this.teachers().find(item => item.id === body.responsibleTeacherId)?.name ?? '' });
      this.form.controls.topics.clear();
      this.form.reset();
    } catch (error: unknown) {
      this.error.set(!(error instanceof HttpErrorResponse) ? 'No se pudo crear el semillero.'
        : error.status === 409 ? 'Ya existe un semillero con ese nombre.'
        : error.status === 400 ? 'Revisa los datos: el responsable debe ser un docente activo y los temas no pueden exceder el límite.'
        : error.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
        : error.status === 403 ? 'No tienes permiso para crear semilleros.'
        : 'No se pudo crear el semillero.');
    } finally { this.saving.set(false); }
  }
}
