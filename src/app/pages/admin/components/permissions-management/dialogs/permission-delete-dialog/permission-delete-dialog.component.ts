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
import { AdminPermission } from '../../../../../../common/admin/models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type PermissionDeleteDialogData = {
  permission: AdminPermission;
};

export type PermissionDeleteDialogResult = {
  deleted: boolean;
};

@Component({
  selector: 'app-permission-delete-dialog',
  templateUrl:
    './permission-delete-dialog.component.html',
})
export class PermissionDeleteDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    PermissionDeleteDialogResult,
    PermissionDeleteDialogComponent
  > = inject(
    DialogRef<
      PermissionDeleteDialogResult,
      PermissionDeleteDialogComponent
    >,
  );
  private readonly _data: PermissionDeleteDialogData =
    inject(DIALOG_DATA);

  public readonly permission: AdminPermission =
    this._data.permission;
  public readonly isDeleting: WritableSignal<boolean> =
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

  public deletePermission(): void {
    this.isDeleting.set(true);
    this._adminService
      .deletePermission(this.permission.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isDeleting.set(false);
          this._toast.success(
            'Permission deleted successfully.',
          );
          this._dialogRef.close({ deleted: true });
        },
        error: (error: unknown): void => {
          this.isDeleting.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to delete permission.',
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
      this.deletePermission();
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
