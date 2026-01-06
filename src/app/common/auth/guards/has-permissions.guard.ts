import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { Session } from 'better-auth';
import { User } from '../../user/models/user.type';

export const hasPermissionsGuard = (
  requiredPermissions: string[],
): CanActivateFn => {
  return (_) => {
    const authService: AuthService = inject(AuthService);
    const router: Router = inject(Router);

    if (
      !requiredPermissions ||
      requiredPermissions.length === 0
    ) {
      return true;
    }

    return authService.getSession().pipe(
      map(
        (res: {
          session: Session;
          user: User;
        }): boolean => {
          const hasPermission: boolean =
            requiredPermissions.some(
              (permission: string): boolean =>
                res.user.permissions.includes(permission),
            );
          if (!hasPermission)
            router.navigate(['/redirect-to-home']);
          return hasPermission;
        },
      ),
      catchError((_) => {
        router.navigate(['/redirect-to-sign-in']);
        return of(false);
      }),
    );
  };
};
