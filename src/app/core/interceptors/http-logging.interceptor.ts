import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { finalize, tap } from 'rxjs';

export const httpLoggingInterceptor: HttpInterceptorFn = (request, next) => {
  const traceId = request.headers.get('X-Trace-Id') ?? 'sin-trace-id';
  const startedAt = performance.now();
  const requestUrl = request.urlWithParams;

  console.info(`[HTTP][${traceId}] Request iniciado.`, {
    method: request.method,
    url: requestUrl,
    headerNames: request.headers.keys(),
    bodyKeys: getBodyKeys(request.body)
  });

  return next(request).pipe(
    tap({
      next: response => {
        console.info(`[HTTP][${traceId}] Response recibido.`, {
          method: request.method,
          url: requestUrl,
          status: response instanceof HttpResponse ? response.status : 'event',
          durationMs: Math.round(performance.now() - startedAt)
        });
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          console.error(`[HTTP][${traceId}] Request fallido.`, {
            method: request.method,
            url: requestUrl,
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            durationMs: Math.round(performance.now() - startedAt),
            likelyCorsOrNetworkError: error.status === 0
          });
        } else {
          console.error(`[HTTP][${traceId}] Error inesperado.`, error);
        }
      }
    }),
    finalize(() => {
      console.info(`[HTTP][${traceId}] Request finalizado.`);
    })
  );
};

function getBodyKeys(body: unknown): string[] {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return [];
  return Object.keys(body);
}
