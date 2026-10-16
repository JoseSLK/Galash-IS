import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { firebaseAuth } from '../config/firebase.config';
import { ApiService } from './api.service';

export type RegistrationRole = 'estudiante' | 'profesor';
export type BackendSessionStatus = 'checking' | 'authenticated' | 'anonymous' | 'expired' | 'unavailable';

export interface RegistrationData {
  nombre: string;
  apellido: string;
  tipo_dni: string;
  dni: string;
  email: string;
  rol: RegistrationRole;
}

export interface SessionUser {
  id: string;
  name?: string;
  last_name?: string;
  role?: string;
  status?: string;
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
        this.clearBackendSession('anonymous');
        throw new RegistrationRequiredError();
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    let logoutError: unknown;

    try {
      await this.api.delete('/auth/sessions/current');
    } catch (error: unknown) {
      if (!(error instanceof HttpErrorResponse && error.status === 401)) {
        logoutError = error;
      }
    }

    try {
      await signOut(firebaseAuth);
    } finally {
      this.clearBackendSession('anonymous');
    }

    if (logoutError) throw logoutError;
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
        email: user.email?.trim() ?? data.email.trim(),
        rol: data.rol
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
      status: user.status
    });
    this.isAuthenticated.set(true);
    this.sessionStatus.set('authenticated');
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
