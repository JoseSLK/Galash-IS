import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const profileGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return toObservable(auth.sessionStatus).pipe(
    filter(status => status !== 'checking'),
    take(1),
    map(status => status === 'authenticated' ? true : router.createUrlTree(['/']))
  );
};
