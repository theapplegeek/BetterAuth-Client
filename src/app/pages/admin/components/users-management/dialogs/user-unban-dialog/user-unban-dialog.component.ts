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
import { AdminHttpService } from '../../../../http/admin.http.server';
import { AdminUser } from '../../../../models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type UserUnbanDialogData = {
  user: AdminUser;
};

export type UserUnbanDialogResult = {
  unbanned: boolean;
};

@Component({
  selector: 'app-user-unban-dialog',
  templateUrl: './user-unban-dialog.component.html',
})
export class UserUnbanDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    UserUnbanDialogResult,
    UserUnbanDialogComponent
  > = inject(
    DialogRef<UserUnbanDialogResult, UserUnbanDialogComponent>,
  );
  private readonly _data: UserUnbanDialogData =
    inject(DIALOG_DATA);

  public readonly user: AdminUser = this._data.user;
  public readonly isSaving: WritableSignal<boolean> =
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

  public confirmUnban(): void {
    this.isSaving.set(true);
    this._adminService
      .unbanUser(this.user.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this._toast.success('User unbanned.');
          this._dialogRef.close({ unbanned: true });
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to unban user.',
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
      this.confirmUnban();
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
