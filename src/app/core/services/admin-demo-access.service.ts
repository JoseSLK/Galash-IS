import { Injectable, computed, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminDemoAccessService {
  private readonly auth = inject(AuthService);
  private readonly account = (environment as typeof environment & { adminDemoAccountEmail?: string })
    .adminDemoAccountEmail?.trim().toLowerCase();

  // Controls only a fictional, in-memory preview. Never grants a backend role.
  readonly allowed = computed(() => {
    const identity = this.auth.currentUser();
    return !!this.account && this.auth.isAuthenticated()
      && this.auth.sessionStatus() === 'authenticated'
      && identity?.emailVerified === true
      && identity.email?.trim().toLowerCase() === this.account;
  });
}
