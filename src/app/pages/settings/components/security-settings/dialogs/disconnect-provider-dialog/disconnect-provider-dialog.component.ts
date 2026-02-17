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
import {
  AccountSecurityService,
  SocialProvider,
} from '../../../../services/account-security.service';
import { ToastService } from '../../../../../../common/services/toast.service';

export type DisconnectProviderDialogData = {
  provider: 'google' | 'discord';
};

export type DisconnectProviderDialogResult = {
  disconnected: boolean;
};

@Component({
  selector: 'app-disconnect-provider-dialog',
  templateUrl:
    './disconnect-provider-dialog.component.html',
})
export class DisconnectProviderDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _accountSecurityService: AccountSecurityService =
    inject(AccountSecurityService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    DisconnectProviderDialogResult,
    DisconnectProviderDialogComponent
  > = inject(
    DialogRef<
      DisconnectProviderDialogResult,
      DisconnectProviderDialogComponent
    >,
  );
  private readonly _data: DisconnectProviderDialogData =
    inject(DIALOG_DATA);

  public readonly provider: 'google' | 'discord' =
    this._data.provider;
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
          this.confirmDisconnect();
        }
      });
  }

  public onClose(): void {
    this._dialogRef.close();
  }

  public confirmDisconnect(): void {
    this.isSaving.set(true);
    this._accountSecurityService
      .unlinkAccount(this.provider as SocialProvider)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this._toast.success(
            `${this.provider} account disconnected.`,
          );
          this._dialogRef.close({ disconnected: true });
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              `Unable to disconnect ${this.provider}.`,
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
