import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AdminDemoAccessService } from '../services/admin-demo-access.service';

export const adminDemoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const demo = inject(AdminDemoAccessService);
  const router = inject(Router);
  const status = toObservable(auth.sessionStatus);
  await auth.waitForAuthInitialization();
  return firstValueFrom(status.pipe(
    filter(value => value !== 'checking'),
    take(1),
    map(() => demo.allowed() ? true : router.createUrlTree(['/']))
  ));
};
