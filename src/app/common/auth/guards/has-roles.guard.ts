import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../auth.service';
import {inject} from '@angular/core';
import {catchError, map, of} from 'rxjs';
import {Session} from 'better-auth';
import {User} from '../../user/models/user.type';

export const hasRolesGuard = (requiredRoles: string[]): CanActivateFn => {
  return (_) => {
    const authService: AuthService = inject(AuthService);
    const router: Router = inject(Router);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return authService.getSession()
      .pipe(
        map((res: { session: Session, user: User }): boolean => {
          const hasRole: boolean = requiredRoles.some((role: string): boolean => res.user.roles.includes(role));
          if (!hasRole) router.navigate(['/redirect-to-home']);
          return hasRole;
        }),
        catchError((_) => {
          router.navigate(['/redirect-to-sign-in']);
          return of(false);
        })
      );
  };
}
