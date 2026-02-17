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
import { AdminHttpService } from '../../../../http/admin-http.service';
import { AdminUser } from '../../../../../../common/admin/models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type UserDeleteDialogData = {
  user: AdminUser;
};

export type UserDeleteDialogResult = {
  deleted: boolean;
};

@Component({
  selector: 'app-user-delete-dialog',
  templateUrl: './user-delete-dialog.component.html',
})
export class UserDeleteDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    UserDeleteDialogResult,
    UserDeleteDialogComponent
  > = inject(
    DialogRef<UserDeleteDialogResult, UserDeleteDialogComponent>,
  );
  private readonly _data: UserDeleteDialogData =
    inject(DIALOG_DATA);

  public readonly user: AdminUser = this._data.user;
  public readonly isDeletingUser: WritableSignal<boolean> =
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

  public deleteSelectedUser(): void {
    this.isDeletingUser.set(true);
    this._adminService
      .removeUser(this.user.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isDeletingUser.set(false);
          this._toast.success('User deleted successfully.');
          this._dialogRef.close({ deleted: true });
        },
        error: (error: unknown): void => {
          this.isDeletingUser.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to delete user.',
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
      this.deleteSelectedUser();
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
