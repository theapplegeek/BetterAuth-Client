import {
  Component,
  DestroyRef,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { AccountSecurityService } from '../../../../services/account-security.service';
import { ToastService } from '../../../../../../common/services/toast.service';

export type RevokeAllSessionsDialogResult = {
  revoked: boolean;
};

@Component({
  selector: 'app-revoke-all-sessions-dialog',
  templateUrl:
    './revoke-all-sessions-dialog.component.html',
})
export class RevokeAllSessionsDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _router: Router = inject(Router);
  private readonly _accountSecurityService: AccountSecurityService =
    inject(AccountSecurityService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    RevokeAllSessionsDialogResult,
    RevokeAllSessionsDialogComponent
  > = inject(
    DialogRef<
      RevokeAllSessionsDialogResult,
      RevokeAllSessionsDialogComponent
    >,
  );

  public readonly isSaving: WritableSignal<boolean> =
    signal<boolean>(false);

  constructor() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.onClose();
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          this.confirmRevoke();
        }
      });
  }

  public onClose(): void {
    this._dialogRef.close();
  }

  public confirmRevoke(): void {
    this.isSaving.set(true);
    this._accountSecurityService
      .revokeAllSessions()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this._toast.success(
            'All sessions revoked. Redirecting to sign in...',
          );
          this._router.navigate(['/redirect-to-sign-in']);
          this._dialogRef.close({ revoked: true });
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to revoke all sessions.',
            ),
          );
        },
      });
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
