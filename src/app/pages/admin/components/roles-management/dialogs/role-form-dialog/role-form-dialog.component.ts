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
import { AdminHttpService } from '../../../../http/admin-http.service';
import {
  AdminPermission,
  AdminRole,
  RoleUpsertPayload,
} from '../../../../../../common/admin/models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type RoleFormDialogData =
  | {
      mode: 'create';
      permissions: AdminPermission[];
    }
  | {
      mode: 'edit';
      role: AdminRole;
      permissions: AdminPermission[];
    };

export type RoleFormDialogResult = {
  saved: boolean;
};

@Component({
  selector: 'app-role-form-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './role-form-dialog.component.html',
})
export class RoleFormDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    RoleFormDialogResult,
    RoleFormDialogComponent
  > = inject(DialogRef<RoleFormDialogResult, RoleFormDialogComponent>);
  private readonly _data: RoleFormDialogData =
    inject(DIALOG_DATA);
  private readonly _editingRole: AdminRole | undefined =
    this._data.mode === 'edit'
      ? this._data.role
      : undefined;

  public readonly isSaving: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly selectedPermissionIds: WritableSignal<
    number[]
  > = signal<number[]>(
    this._editingRole?.permissions?.map(
      (permission: AdminPermission): number =>
        permission.id,
    ) ?? [],
  );

  public readonly roleForm = new FormGroup({
    name: new FormControl(
      this._editingRole?.name ?? '',
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
        ],
      },
    ),
    description: new FormControl(
      this._editingRole?.description ?? '',
      {
        nonNullable: true,
      },
    ),
  });

  public readonly mode: 'create' | 'edit' =
    this._data.mode;
  public readonly permissions: AdminPermission[] =
    this._data.permissions;

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

  public togglePermission(
    permissionId: number,
    event: Event,
  ): void {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;

    this.selectedPermissionIds.update(
      (selectedIds: number[]): number[] => {
        if (checked) {
          return Array.from(
            new Set([...selectedIds, permissionId]),
          );
        }

        return selectedIds.filter(
          (selectedId: number): boolean =>
            selectedId !== permissionId,
        );
      },
    );
  }

  public isPermissionSelected(permissionId: number): boolean {
    return this.selectedPermissionIds().includes(
      permissionId,
    );
  }

  public saveRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const formValue = this.roleForm.getRawValue();
    const payload: RoleUpsertPayload = {
      name: formValue.name.trim(),
      description:
        formValue.description.trim() || undefined,
      permissionIds: this.selectedPermissionIds(),
    };

    this.isSaving.set(true);

    if (this.mode === 'create') {
      this._adminService
        .createRole(payload)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: (): void => {
            this.isSaving.set(false);
            this._toast.success(
              'Role created successfully.',
            );
            this._dialogRef.close({ saved: true });
          },
          error: (error: unknown): void => {
            this.isSaving.set(false);
            this._toast.error(
              this._extractErrorMessage(
                error,
                'Unable to create role.',
              ),
            );
          },
        });
      return;
    }

    const editingRole = this._editingRole;
    if (!editingRole) {
      this.isSaving.set(false);
      this._toast.error('Missing role data.');
      return;
    }

    this._adminService
      .updateRole(editingRole.id, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this._toast.success(
            'Role updated successfully.',
          );
          this._dialogRef.close({ saved: true });
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to update role.',
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
      this.saveRole();
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
