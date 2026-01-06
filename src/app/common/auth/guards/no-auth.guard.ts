import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {catchError, map, of} from 'rxjs';
import {AuthService} from '../auth.service';
import {Session} from 'better-auth';
import {User} from '../../user/models/user.type';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return authService.getSession()
    .pipe(
      map((res: { session: Session, user: User }): boolean => {
        if (state.url === '/auth/sign-in/two-factor-enable') {
          return true;
        }
        if (res) {
          router.navigate(['/redirect-to-home']);
        }
        return !res;
      }),
      catchError((_) => {
        return of(true);
      })
    );
}
