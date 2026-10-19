import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

const REQUEST_TIMEOUT_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<TResponse>(path: string): Promise<TResponse> {
    return firstValueFrom(this.http.get<TResponse>(this.endpoint(path), {
      withCredentials: true
    }).pipe(timeout(REQUEST_TIMEOUT_MS)));
  }

  post<TResponse, TBody>(
    path: string,
    body: TBody,
    headers?: Record<string, string>
  ): Promise<TResponse> {
    return firstValueFrom(this.http.post<TResponse>(this.endpoint(path), body, {
      headers,
      withCredentials: true
    }).pipe(timeout(REQUEST_TIMEOUT_MS)));
  }

  delete(path: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(this.endpoint(path), {
      withCredentials: true
    }).pipe(timeout(REQUEST_TIMEOUT_MS)));
  }

  private endpoint(path: string): string {
    return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
  }
}
