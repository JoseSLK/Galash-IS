import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { firebaseAuth } from '../config/firebase.config';
import { ApiService } from './api.service';
import { parseUserRole, USER_ROLES, UserRole } from '../models/role.model';

export type BackendSessionStatus = 'checking' | 'authenticated' | 'anonymous' | 'expired' | 'unavailable';

export interface RegistrationData {
  nombre: string;
  apellido: string;
  tipo_dni: string;
  dni: string;
  email: string;
}

export interface SessionUser {
  id: string;
  name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  email?: string;
  document_type?: string;
  document_number?: string;
}

interface BackendUser extends SessionUser {
  email?: string;
  document_type?: string;
  document_number?: string;
  firebase_uid?: string;
}

interface AuthSessionResponse {
  user: BackendUser;
}

interface RegistrationResponse {
  id: string;
  firebase_uid: string;
}

export class RegistrationRequiredError extends Error {}
export class RegistrationSaveError extends Error {}
export class RegistrationSessionError extends Error {}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private sessionRequestId = 0;
  private resolveAuthInitialized!: () => void;
  private readonly authInitialized = new Promise<void>(resolve => {
    this.resolveAuthInitialized = resolve;
  });

  readonly currentUser = signal<User | null>(null);
  readonly backendUser = signal<SessionUser | null>(null);
  readonly isAuthenticated = signal(false);
  readonly sessionStatus = signal<BackendSessionStatus>('checking');
  readonly effectiveRole = computed(() => this.isAuthenticated() && this.sessionStatus() === 'authenticated'
    ? parseUserRole(this.backendUser()?.role) : null);
  readonly isAdmin = computed(() => this.hasRole('admin'));

  hasRole(role: UserRole): boolean {
    return this.effectiveRole() === role;
  }
  readonly profileName = computed(() => {
    if (!this.isAuthenticated()) return '';
    const user = this.backendUser();
    return [user?.name, user?.last_name].filter(Boolean).join(' ').trim() || this.currentUser()?.displayName || 'Mi cuenta';
  });
  readonly profileEmail = computed(() => this.isAuthenticated() ? this.backendUser()?.email || this.currentUser()?.email || '' : '');
  readonly profileInitials = computed(() => this.profileName().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase());
  readonly profileRole = computed(() => {
    if (!this.isAuthenticated()) return '';
    return USER_ROLES.find(role => role.id === this.effectiveRole())?.label || 'Rol no disponible';
  });

  constructor() {
    onAuthStateChanged(firebaseAuth, (user: User | null) => {
      this.currentUser.set(user);
      this.resolveAuthInitialized();
      void this.restoreBackendSession();
    });
  }

  waitForAuthInitialization(): Promise<void> {
    return this.authInitialized;
  }

  async loginWithGoogle(): Promise<void> {
    const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    this.currentUser.set(credential.user);
    try {
      await this.createBackendSession(credential.user);
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 403) {
        // Firebase identity is kept on purpose: registration completes with it.
        this.clearBackendSession('anonymous');
        throw new RegistrationRequiredError();
      }
      // The backend did not accept this login. Dropping the Firebase identity avoids a
      // stale "expired" state where every later restore fails against the same identity.
      await this.discardFirebaseSession();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.delete('/auth/sessions/current');
    } catch (error: unknown) {
      // 401 means there is no live backend session to revoke. Any other failure keeps the
      // local state, so the UI never reports "anonymous" while the server session still exists.
      if (!(error instanceof HttpErrorResponse && error.status === 401)) throw error;
    }

    try {
      await signOut(firebaseAuth);
    } finally {
      this.clearBackendSession('anonymous');
    }
  }

  async registerGoogleUser(data: RegistrationData): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user) throw new RegistrationRequiredError();

    const token = await user.getIdToken();
    let result: unknown;
    try {
      result = await this.api.post<unknown, RegistrationData>('/auth/register', {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        tipo_dni: data.tipo_dni,
        dni: data.dni.trim(),
        email: user.email?.trim() ?? data.email.trim()
      }, authorizationHeader(token));
    } catch {
      throw new RegistrationSaveError();
    }
    if (!isRegistrationResponse(result, user.uid)) throw new RegistrationSaveError();

    try {
      await this.createBackendSession(user, token);
    } catch {
      throw new RegistrationSessionError();
    }
  }

  async cancelGoogleRegistration(): Promise<void> {
    await this.logout();
  }

  private async createBackendSession(user: User, firebaseIdToken?: string): Promise<void> {
    const token = firebaseIdToken ?? await user.getIdToken();
    const response = await this.api.post<AuthSessionResponse, Record<string, never>>(
      '/auth/sessions',
      {},
      authorizationHeader(token)
    );
    this.setBackendSession(response.user);
  }

  private async restoreBackendSession(): Promise<void> {
    const requestId = ++this.sessionRequestId;
    this.sessionStatus.set('checking');

    try {
      const user = await this.api.get<BackendUser>('/users/me');
      if (requestId === this.sessionRequestId) this.setBackendSession(user);
    } catch (error: unknown) {
      if (requestId !== this.sessionRequestId) return;

      const status = error instanceof HttpErrorResponse && error.status === 401
        ? (this.currentUser() ? 'expired' : 'anonymous')
        : 'unavailable';
      this.clearBackendSession(status);
    }
  }

  private setBackendSession(user: BackendUser): void {
    this.sessionRequestId++;
    this.backendUser.set({
      id: user.id,
      name: user.name,
      last_name: user.last_name,
      role: user.role,
      email: user.email,
      document_type: user.document_type,
      document_number: user.document_number,
      status: user.status
    });
    this.isAuthenticated.set(true);
    this.sessionStatus.set('authenticated');
  }

  private async discardFirebaseSession(): Promise<void> {
    await signOut(firebaseAuth).catch(() => undefined);
    this.clearBackendSession('anonymous');
  }

  private clearBackendSession(status: Exclude<BackendSessionStatus, 'checking' | 'authenticated'>): void {
    this.sessionRequestId++;
    this.backendUser.set(null);
    this.isAuthenticated.set(false);
    this.sessionStatus.set(status);
  }
}

function authorizationHeader(firebaseIdToken: string): Record<string, string> {
  return { Authorization: `Bearer ${firebaseIdToken}` };
}

function isRegistrationResponse(value: unknown, firebaseUid: string): value is RegistrationResponse {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as Partial<RegistrationResponse>;
  return typeof response.id === 'string'
    && response.id.trim().length > 0
    && response.firebase_uid === firebaseUid;
}
