import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface JoinRequestReceipt {
  id: string;
  trackingToken: string;
  status: string;
  submittedAt: string;
  seedbed: string;
}

interface CreatedRegistration {
  id: string;
  estado: string;
  fechaRadicacion: string;
  trackingToken: string;
}

// Form keys -> POST /registration-requests fields (M3).
export const JOIN_REQUEST_FIELDS: Record<string, string> = {
  fullName: 'nombre',
  document: 'cc',
  studentCode: 'cod',
  phone: 'telefono',
  birthDate: 'fechaNacimiento',
  birthPlace: 'lugarNacimiento',
  address: 'direccionResidencia',
  cvlac: 'linkCvLAC',
  orcid: 'linkORCID',
  education: 'maximoNivelEstudio',
  educationTitle: 'tituloMaximoNivelEstudio',
  undergraduateTitle: 'tituloPregrado',
  affiliation: 'vinculacion',
  researcherCategory: 'categoriaActualInvestigador',
  call: 'convocatoriaMinCiencias',
  seedbed: 'seedbedId'
};

@Injectable({ providedIn: 'root' })
export class JoinRequestService {
  private readonly api = inject(ApiService);

  async submit(data: Readonly<Record<string, string>>): Promise<JoinRequestReceipt> {
    const body = Object.fromEntries(Object.entries(JOIN_REQUEST_FIELDS).map(([key, field]) => [field, data[key] ?? '']));
    const created = await this.api.post<CreatedRegistration, Record<string, string>>('/registration-requests', body);
    return {
      id: created.id,
      trackingToken: created.trackingToken,
      status: created.estado,
      submittedAt: created.fechaRadicacion,
      seedbed: data['seedbed'] || ''
    };
  }
}
