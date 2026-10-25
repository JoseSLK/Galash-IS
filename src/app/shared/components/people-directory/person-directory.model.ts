import { UserRole } from '../../../core/models/role.model';

export type AccountStatus = 'active' | 'inactive';
export interface DirectoryPerson {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  status: AccountStatus;
  seedbed: string;
  joinedAt: string;
}

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: 'Activa', inactive: 'Inactiva'
};
