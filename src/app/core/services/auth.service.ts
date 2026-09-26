import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import { firebaseAuth } from '../config/firebase.config';
import { API_BASE_URL } from '../config/api.config';
import { firstValueFrom, timeout } from 'rxjs';

export interface CompleteRegistrationData {
  nombre: string;
  apellido: string;
  tipo_dni: string;
  dni: string;
  email: string;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly isAuthenticated = signal(false);
  readonly currentUser = signal<User | null>(null);

  constructor() {
    onAuthStateChanged(firebaseAuth, (user: User | null) => {
      this.currentUser.set(user);
      this.isAuthenticated.set(user !== null);
    });
  }

  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(firebaseAuth, email.trim(), password).then(() => undefined);
  }

  loginWithGoogle(): Promise<void> {
    return signInWithPopup(firebaseAuth, new GoogleAuthProvider()).then(() => undefined);
  }

  logout(): Promise<void> {
    return signOut(firebaseAuth);
  }

  async register(
    nombre: string,
    apellido: string,
    email: string,
    password: string,
    traceId = createTraceId()
  ): Promise<void> {
    const logPrefix = `[AuthService][registro:${traceId}]`;
    console.info(`${logPrefix} Iniciando flujo de registro Firebase.`);

    let credential;
    try {
      credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      console.info(`${logPrefix} Cuenta creada en Firebase. UID recibido.`);
    } catch (error: unknown) {
      console.error(`${logPrefix} Firebase rechazó la creación de la cuenta.`, getFirebaseError(error));
      throw error;
    }

    let token: string;
    try {
      token = await credential.user.getIdToken();
      console.info(`${logPrefix} ID token obtenido. No se imprime por seguridad.`);
    } catch (error: unknown) {
      console.error(`${logPrefix} No se pudo obtener el ID token de Firebase.`, error);
      throw error;
    }

    const endpoint = `${API_BASE_URL}/auth/register`;
    const payload = {
      nombre: nombre.trim(),
      apellido: apellido.trim()
    };
    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Trace-Id': traceId
    };

    console.info(`${logPrefix} Enviando POST al servicio Auth.`, {
      endpoint,
      payload,
      hasAuthorizationToken: Boolean(token)
    });

    try {
      await firstValueFrom(this.http.post<void>(endpoint, payload, {
        headers
      }).pipe(timeout(10000)));
      console.info(`${logPrefix} Servicio Auth respondió correctamente.`);
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        console.error(`${logPrefix} Servicio Auth respondió con error HTTP.`, {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          response: error.error
        });
      } else {
        console.error(`${logPrefix} No hubo respuesta del servicio Auth o la petición fue cancelada.`, error);
      }
      throw error;
    }
  }

  async completeRegistration(data: CompleteRegistrationData): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('No hay una sesión activa');

    const token = await user.getIdToken();
    await firstValueFrom(this.http.post<void>(`${API_BASE_URL}/auth/register`, {
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      tipo_dni: data.tipo_dni,
      dni: data.dni.trim(),
      email: data.email.trim(),
      estado: data.estado
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }
}

function createTraceId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `registro-${Date.now()}`;
}

function getFirebaseError(error: unknown): { code?: string; message?: string } {
  if (typeof error !== 'object' || error === null) return {};

  const firebaseError = error as { code?: unknown; message?: unknown };
  return {
    code: typeof firebaseError.code === 'string' ? firebaseError.code : undefined,
    message: typeof firebaseError.message === 'string' ? firebaseError.message : undefined
  };
}
