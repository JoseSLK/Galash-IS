import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { JoinRequestService } from './join-request.service';

describe('JoinRequestService', () => {
  let service: JoinRequestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(JoinRequestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps form keys to the M3 payload and returns the tracking receipt', async () => {
    const receipt = service.submit({
      fullName: 'Ana Pérez', document: '123', studentCode: '456', phone: '3001234567',
      birthDate: '2000-01-31', birthPlace: 'Tunja', address: 'Calle 1', cvlac: 'https://cvlac.test',
      orcid: 'https://orcid.test', education: 'Pregrado', educationTitle: 'Ingeniería',
      undergraduateTitle: 'Ingeniería', affiliation: 'Estudiante', researcherCategory: 'Sin categoría',
      call: 'Sin participación', seedbed: 's1'
    });
    const request = http.expectOne({ method: 'POST', url: '/api/registration-requests' });
    expect(request.request.body).toEqual({
      nombre: 'Ana Pérez', cc: '123', cod: '456', telefono: '3001234567', fechaNacimiento: '2000-01-31',
      lugarNacimiento: 'Tunja', direccionResidencia: 'Calle 1', linkCvLAC: 'https://cvlac.test',
      linkORCID: 'https://orcid.test', maximoNivelEstudio: 'Pregrado', tituloMaximoNivelEstudio: 'Ingeniería',
      tituloPregrado: 'Ingeniería', vinculacion: 'Estudiante', categoriaActualInvestigador: 'Sin categoría',
      convocatoriaMinCiencias: 'Sin participación', seedbedId: 's1'
    });
    request.flush({ id: 'r1', estado: 'Radicada', fechaRadicacion: '2026-10-27T12:00:00Z', trackingToken: 'tok' });
    await expect(receipt).resolves.toEqual({
      id: 'r1', trackingToken: 'tok', status: 'Radicada', submittedAt: '2026-10-27T12:00:00Z', seedbed: 's1'
    });
  });
});
