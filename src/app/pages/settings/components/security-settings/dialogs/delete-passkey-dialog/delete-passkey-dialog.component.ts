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
import { fromEvent } from 'rxjs';
import { AccountSecurityService } from '../../../../../../common/auth/account-security.service';
import { ToastService } from '../../../../../../common/services/toast.service';

export type DeletePasskeyDialogData = {
  passkeyId: string;
};

export type DeletePasskeyDialogResult = {
  deleted: boolean;
};

@Component({
  selector: 'app-delete-passkey-dialog',
  templateUrl: './delete-passkey-dialog.component.html',
})
export class DeletePasskeyDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _accountSecurityService: AccountSecurityService =
    inject(AccountSecurityService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    DeletePasskeyDialogResult,
    DeletePasskeyDialogComponent
  > = inject(
    DialogRef<
      DeletePasskeyDialogResult,
      DeletePasskeyDialogComponent
    >,
  );
  private readonly _data: DeletePasskeyDialogData =
    inject(DIALOG_DATA);

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
          this.confirmDelete();
        }
      });
  }

  public onClose(): void {
    this._dialogRef.close();
  }

  public confirmDelete(): void {
    this.isSaving.set(true);
    this._accountSecurityService
      .deletePasskey(this._data.passkeyId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this._toast.success('Passkey removed.');
          this._dialogRef.close({ deleted: true });
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to delete passkey.',
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
