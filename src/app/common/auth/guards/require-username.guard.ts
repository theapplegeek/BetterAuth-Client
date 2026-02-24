import { inject } from '@angular/core';
import {
  CanActivateChildFn,
  Router,
  UrlTree,
} from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth.service';
import { Session } from 'better-auth';
import { User } from '../../user/models/user.type';

export const requireUsernameGuard: CanActivateChildFn = (
  _,
  state,
) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return authService.getSession().pipe(
    map(
      (
        sessionData: { session: Session; user: User },
      ): boolean | UrlTree => {
        const normalizedName: string =
          sessionData.user.name.trim();

        if (normalizedName.length > 0) {
          return true;
        }

        return router.createUrlTree(
          ['/onboarding/username'],
          {
            queryParams: {
              returnUrl: state.url,
            },
          },
        );
      },
    ),
    catchError(() =>
      of(router.createUrlTree(['/redirect-to-sign-in'])),
    ),
  );
};
