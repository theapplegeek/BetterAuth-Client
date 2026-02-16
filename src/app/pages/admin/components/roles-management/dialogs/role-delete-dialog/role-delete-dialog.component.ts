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
import { AdminService } from '../../../../../../common/admin/admin.service';
import { AdminRole } from '../../../../../../common/admin/models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type RoleDeleteDialogData = {
  role: AdminRole;
};

export type RoleDeleteDialogResult = {
  deleted: boolean;
};

@Component({
  selector: 'app-role-delete-dialog',
  templateUrl: './role-delete-dialog.component.html',
})
export class RoleDeleteDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminService =
    inject(AdminService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    RoleDeleteDialogResult,
    RoleDeleteDialogComponent
  > = inject(
    DialogRef<
      RoleDeleteDialogResult,
      RoleDeleteDialogComponent
    >,
  );
  private readonly _data: RoleDeleteDialogData =
    inject(DIALOG_DATA);

  public readonly role: AdminRole = this._data.role;
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

  public deleteRole(): void {
    this.isDeleting.set(true);
    this._adminService
      .deleteRole(this.role.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isDeleting.set(false);
          this._toast.success('Role deleted successfully.');
          this._dialogRef.close({ deleted: true });
        },
        error: (error: unknown): void => {
          this.isDeleting.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to delete role.',
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
      this.deleteRole();
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
