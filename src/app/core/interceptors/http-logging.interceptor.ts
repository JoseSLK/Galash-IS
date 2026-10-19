import { HttpInterceptorFn } from '@angular/common/http';

export const httpLoggingInterceptor: HttpInterceptorFn = (request, next) => next(request);
