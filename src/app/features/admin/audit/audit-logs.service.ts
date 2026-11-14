import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

// M12 GET /audit-logs: immutable log, read-only for Admin.
export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  date: string;
  result: string;
  origin?: string;
}

export interface AuditFilter { actor?: string; action?: string; entity?: string; from?: string; to?: string; }

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private readonly api = inject(ApiService);

  async list(filter: AuditFilter = {}): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filter)) if (value?.trim()) params.set(key, value.trim());
    const query = params.toString();
    const { auditLogs } = await this.api.get<{ auditLogs: AuditLog[] | null }>(`/audit-logs${query ? '?' + query : ''}`);
    return auditLogs ?? [];
  }
}
