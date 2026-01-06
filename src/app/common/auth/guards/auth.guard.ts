import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth.service';
import { Session } from 'better-auth';
import { User } from '../../user/models/user.type';

export const authGuard: CanActivateFn = (_) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return authService.getSession().pipe(
    map(
      (res: { session: Session; user: User }): boolean => {
        return !!res;
      },
    ),
    catchError((_) => {
      router.navigate(['/redirect-to-sign-in']);
      return of(false);
    }),
  );
};
