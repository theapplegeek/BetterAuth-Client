import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../auth.service';
import {catchError, map, of} from 'rxjs';
import {Session} from 'better-auth';
import {User} from '../../user/models/user.type';

export const betterAuthAdminGuard: CanActivateFn = (_) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return authService.getSession()
    .pipe(
      map((res: { session: Session, user: User }): boolean => {
        if (!res || res.user.role !== 'admin') {
          router.navigate(['/redirect-to-home']);
        }
        return res!.user.role === 'admin';
      }),
      catchError((_) => {
        router.navigate(['/redirect-to-sign-in']);
        return of(false);
      })
    );
}
