import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import type { User } from 'firebase/auth';
import { ApiService } from './api.service';
import { parseUserRole, USER_ROLES, UserRole } from '../models/role.model';

export type BackendSessionStatus = 'checking' | 'authenticated' | 'anonymous' | 'expired' | 'unavailable';

export interface RegistrationData {
  nombre: string;
  apellido: string;
  tipo_dni: string;
  dni: string;
  email: string;
  fecha_nacimiento: string;
  telefono: string;
  codigo_estudiantil: string;
  claim_id?: string;
}

export interface RegistrationMatch { id: string; name: string; role: 'docente' | 'estudiante'; }

export interface SessionUser {
  id: string;
  name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  email?: string;
  document_type?: string;
  document_number?: string;
  student_code?: string;
  birth_date?: string;
  phone?: string;
  photo_url?: string;
  managed_seedbed_ids?: string[];
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

type FirebaseKit = typeof import('firebase/auth') & { auth: import('firebase/auth').Auth };

export class RegistrationRequiredError extends Error {}
export class RegistrationSaveError extends Error {}
export class RegistrationConflictError extends Error {}
export class RegistrationSessionError extends Error {}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private sessionRequestId = 0;
  private resolveAuthInitialized!: () => void;
  private readonly authInitialized = new Promise<void>(resolve => {
    this.resolveAuthInitialized = resolve;
  });
  private firebaseKit?: Promise<FirebaseKit>;

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
    // The backend session lives in a cookie, so it is restored without Firebase. Firebase Auth (~90 KiB)
    // loads when the browser is idle or on first use, keeping it out of the first paint (D008).
    void this.restoreBackendSession();
    const idle = (globalThis as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1));
    idle(() => void this.firebase());
  }

  private firebase(): Promise<FirebaseKit> {
    this.firebaseKit ??= Promise.all([import('firebase/auth'), import('../config/firebase.config')]).then(([sdk, config]) => {
      let first = true;
      sdk.onAuthStateChanged(config.firebaseAuth, (user: User | null) => {
        this.currentUser.set(user);
        this.resolveAuthInitialized();
        // The startup restore already ran; repeat it only when Firebase reports a user (expired vs anonymous) or a later change.
        if (!first || user) void this.restoreBackendSession();
        first = false;
      });
      return { ...sdk, auth: config.firebaseAuth };
    });
    return this.firebaseKit;
  }

  waitForAuthInitialization(): Promise<void> {
    return this.authInitialized;
  }

  async loginWithGoogle(): Promise<void> {
    const { signInWithPopup, GoogleAuthProvider, auth } = await this.firebase();
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
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
      const { signOut, auth } = await this.firebase();
      await signOut(auth);
    } finally {
      this.clearBackendSession('anonymous');
    }
  }

  async updateOwnPhoto(photo_url: string): Promise<void> {
    const id = this.backendUser()?.id;
    const result = await this.api.put<{photo_url: string}, {photo_url: string}>('/users/me/photo', {photo_url: photo_url.trim()});
    this.backendUser.update(user => user && user.id === id ? {...user, photo_url: result.photo_url} : user);
  }

  async registrationMatches(): Promise<RegistrationMatch[]> {
    const user = (await this.firebase()).auth.currentUser;
    if (!user) throw new RegistrationRequiredError();
    const token = await user.getIdToken();
    const response = await this.api.get<{ matches: RegistrationMatch[] }>('/auth/register/matches', authorizationHeader(token));
    return response.matches;
  }

  async registerGoogleUser(data: RegistrationData): Promise<void> {
    const user = (await this.firebase()).auth.currentUser;
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
        fecha_nacimiento: data.fecha_nacimiento,
        telefono: data.telefono.trim(),
        codigo_estudiantil: data.codigo_estudiantil.trim(),
        ...(data.claim_id?.trim() ? { claim_id: data.claim_id.trim() } : {})
      }, authorizationHeader(token));
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 409) throw new RegistrationConflictError();
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
      student_code: user.student_code,
      birth_date: user.birth_date,
      phone: user.phone,
      photo_url: user.photo_url,
      managed_seedbed_ids: user.managed_seedbed_ids ?? [],
      status: user.status
    });
    this.isAuthenticated.set(true);
    this.sessionStatus.set('authenticated');
  }

  private async discardFirebaseSession(): Promise<void> {
    await this.firebase().then(({ signOut, auth }) => signOut(auth)).catch(() => undefined);
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
