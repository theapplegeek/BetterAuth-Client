import {
  Component,
  DestroyRef,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import {
  DIALOG_DATA,
  DialogRef,
} from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { AdminHttpService } from '../../../../http/admin.http.server';
import { AuthService } from '../../../../../../common/auth/auth.service';
import { AdminUser } from '../../../../models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type UserImpersonateDialogData = {
  user: AdminUser;
};

export type UserImpersonateDialogResult = {
  impersonated: boolean;
};

@Component({
  selector: 'app-user-impersonate-dialog',
  templateUrl: './user-impersonate-dialog.component.html',
})
export class UserImpersonateDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _authService: AuthService =
    inject(AuthService);
  private readonly _router: Router = inject(Router);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    UserImpersonateDialogResult,
    UserImpersonateDialogComponent
  > = inject(
    DialogRef<
      UserImpersonateDialogResult,
      UserImpersonateDialogComponent
    >,
  );
  private readonly _data: UserImpersonateDialogData =
    inject(DIALOG_DATA);

  public readonly user: AdminUser = this._data.user;
  public readonly isImpersonatingUser: WritableSignal<boolean> =
    signal<boolean>(false);

  constructor() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((event: KeyboardEvent): void => {
        this._handleKeydown(event);
      });
  }

  public onClose(): void {
    this._dialogRef.close();
  }

  public confirmImpersonation(): void {
    this.isImpersonatingUser.set(true);
    this._adminService
      .impersonateUser(this.user.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isImpersonatingUser.set(false);
          this._authService
            .getJwtToken()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe();
          this._router.navigate(['/home']);
          this._dialogRef.close({ impersonated: true });
        },
        error: (error: unknown): void => {
          this.isImpersonatingUser.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to impersonate user.',
            ),
          );
        },
      });
  }

  private _handleKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.onClose();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmImpersonation();
    }
  }

  private _extractErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (!error || typeof error !== 'object') {
      return fallback;
    }

    const candidate = error as {
      message?: string;
      statusText?: string;
    };
    return (
      candidate.message ?? candidate.statusText ?? fallback
    );
  }
}
