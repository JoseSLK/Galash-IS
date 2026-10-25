import { Injectable } from '@angular/core';

export interface JoinRequestReceipt {
  code: string;
  status: 'Radicada';
  submittedAt: Date;
  seedbed: string;
}

@Injectable({ providedIn: 'root' })
export class JoinRequestService {
  // TEMPORAL: simulación local; sustituir este método por el servicio real cuando exista.
  // No conserva ni transmite los datos personales recibidos.
  async submit(data: Readonly<Record<string, string>>): Promise<JoinRequestReceipt> {
    await new Promise<void>(resolve => setTimeout(resolve, 650));
    return {
      code: `DEMO-GALASH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'Radicada',
      submittedAt: new Date(),
      seedbed: data['seedbed'] || ''
    };
  }
}
