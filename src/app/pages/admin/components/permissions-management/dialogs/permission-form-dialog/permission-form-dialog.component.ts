import {
  Component,
  DestroyRef,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  DIALOG_DATA,
  DialogRef,
} from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { AdminService } from '../../../../../../common/admin/admin.service';
import {
  AdminPermission,
  PermissionUpsertPayload,
} from '../../../../../../common/admin/models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type PermissionFormDialogData =
  | { mode: 'create' }
  | { mode: 'edit'; permission: AdminPermission };

export type PermissionFormDialogResult = {
  saved: boolean;
};

@Component({
  selector: 'app-permission-form-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './permission-form-dialog.component.html',
})
export class PermissionFormDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminService =
    inject(AdminService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    PermissionFormDialogResult,
    PermissionFormDialogComponent
  > = inject(
    DialogRef<
      PermissionFormDialogResult,
      PermissionFormDialogComponent
    >,
  );
  private readonly _data: PermissionFormDialogData =
    inject(DIALOG_DATA);
  private readonly _editingPermission: AdminPermission | undefined =
    this._data.mode === 'edit'
      ? this._data.permission
      : undefined;

  public readonly mode: 'create' | 'edit' =
    this._data.mode;
  public readonly isSaving: WritableSignal<boolean> =
    signal<boolean>(false);

  public readonly permissionForm = new FormGroup({
    code: new FormControl(
      this._editingPermission?.code ?? '',
      {
        nonNullable: true,
        validators: [Validators.required],
      },
    ),
    name: new FormControl(
      this._editingPermission?.name ?? '',
      {
        nonNullable: true,
        validators: [Validators.required],
      },
    ),
    description: new FormControl(
      this._editingPermission?.description ?? '',
      {
        nonNullable: true,
      },
    ),
  });

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

  public savePermission(): void {
    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return;
    }

    const formValue = this.permissionForm.getRawValue();
    const payload: PermissionUpsertPayload = {
      code: formValue.code.trim(),
      name: formValue.name.trim(),
      description:
        formValue.description.trim() || undefined,
    };

    this.isSaving.set(true);

    if (this.mode === 'create') {
      this._adminService
        .createPermission(payload)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: (): void => {
            this.isSaving.set(false);
            this._toast.success(
              'Permission created successfully.',
            );
            this._dialogRef.close({ saved: true });
          },
          error: (error: unknown): void => {
            this.isSaving.set(false);
            this._toast.error(
              this._extractErrorMessage(
                error,
                'Unable to create permission.',
              ),
            );
          },
        });
      return;
    }

    const editingPermission = this._editingPermission;
    if (!editingPermission) {
      this.isSaving.set(false);
      this._toast.error('Missing permission data.');
      return;
    }

    this._adminService
      .updatePermission(editingPermission.id, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this._toast.success(
            'Permission updated successfully.',
          );
          this._dialogRef.close({ saved: true });
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to update permission.',
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

    if (
      event.key === 'Enter' &&
      !(event.target instanceof HTMLTextAreaElement)
    ) {
      event.preventDefault();
      this.savePermission();
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
