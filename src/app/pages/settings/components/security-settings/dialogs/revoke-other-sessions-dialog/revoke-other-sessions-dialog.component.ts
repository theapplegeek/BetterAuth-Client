import {
  Component,
  DestroyRef,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { AccountSecurityService } from '../../../../../../common/auth/account-security.service';
import { ToastService } from '../../../../../../common/services/toast.service';

export type RevokeOtherSessionsDialogResult = {
  revoked: boolean;
};

@Component({
  selector: 'app-revoke-other-sessions-dialog',
  templateUrl:
    './revoke-other-sessions-dialog.component.html',
})
export class RevokeOtherSessionsDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _accountSecurityService: AccountSecurityService =
    inject(AccountSecurityService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    RevokeOtherSessionsDialogResult,
    RevokeOtherSessionsDialogComponent
  > = inject(
    DialogRef<
      RevokeOtherSessionsDialogResult,
      RevokeOtherSessionsDialogComponent
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
      .revokeOtherSessions()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this._toast.success('Other sessions revoked.');
          this._dialogRef.close({ revoked: true });
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to revoke other sessions.',
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
