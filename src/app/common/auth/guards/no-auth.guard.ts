import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth.service';
import { Session } from 'better-auth';
import { User } from '../../user/models/user.type';

export const noAuthGuard: CanActivateFn = (
  route,
  state,
) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return authService.getSession().pipe(
    map(
      (res: { session: Session; user: User }): boolean => {
        const allowsAuthenticatedAccess: boolean =
          state.url.startsWith(
            '/auth/sign-in/two-factor-enable',
          ) ||
          state.url.startsWith('/auth/reset-password');

        if (allowsAuthenticatedAccess) {
          return true;
        }

        if (res) {
          router.navigate(['/redirect-to-home']);
          return false;
        }

        return true;
      },
    ),
    catchError((_) => {
      return of(true);
    }),
  );
};
