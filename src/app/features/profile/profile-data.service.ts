import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface MemberProfile {
  id: string;
  name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  status?: string;
  area?: string;
  formation?: string;
  orcid?: string;
  cvlac?: string;
  google_scholar?: string;
  visible_publicly?: boolean;
  photo_url?: string;
}

export interface SelfProfilePatch {
  phone?: string;
  birth_date?: string;
  area?: string;
  formation?: string;
  orcid?: string;
  cvlac?: string;
  google_scholar?: string;
  visible_publicly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfileDataService {
  private readonly api = inject(ApiService);

  ownMemberProfile(userId: string): Promise<MemberProfile> {
    return this.api.get<MemberProfile>(`/members/${encodeURIComponent(userId)}`);
  }

  updateOwnProfile(patch: SelfProfilePatch): Promise<MemberProfile> {
    return this.api.patch<MemberProfile, SelfProfilePatch>('/users/me', patch);
  }
}
