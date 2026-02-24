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
import { AdminHttpService } from '../../../../http/admin.http.server';
import {
  AdminRole,
  AdminUser,
  UserUpsertPayload,
} from '../../../../models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';
import { trimControls } from '../../../../../../common/forms/input-normalizer.util';

export type UserFormDialogData =
  | {
      mode: 'create';
      roles: AdminRole[];
    }
  | {
      mode: 'edit';
      user: AdminUser;
      roles: AdminRole[];
    };

export type UserFormDialogResult = {
  saved: boolean;
};

@Component({
  selector: 'app-user-form-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './user-form-dialog.component.html',
})
export class UserFormDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    UserFormDialogResult,
    UserFormDialogComponent
  > = inject(
    DialogRef<UserFormDialogResult, UserFormDialogComponent>,
  );
  private readonly _data: UserFormDialogData =
    inject(DIALOG_DATA);
  private readonly _editingUser: AdminUser | undefined =
    this._data.mode === 'edit'
      ? this._data.user
      : undefined;

  public readonly mode: 'create' | 'edit' =
    this._data.mode;
  public readonly roles: AdminRole[] = this._data.roles;
  public readonly isSavingUser: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly selectedRoleIds: WritableSignal<
    number[]
  > = signal<number[]>(
    this._editingUser?.roles.map(
      (role: AdminRole): number => role.id,
    ) ?? [],
  );

  public readonly userForm = new FormGroup({
    name: new FormControl(
      this._editingUser?.name ?? '',
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
        ],
      },
    ),
    email: new FormControl(
      this._editingUser?.email ?? '',
      {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      },
    ),
    canManageUsersPermissions: new FormControl(
      this._editingUser?.role === 'admin',
      {
        nonNullable: true,
      },
    ),
    image: new FormControl(
      this._editingUser?.image ?? '',
      {
        nonNullable: true,
      },
    ),
    emailVerified: new FormControl(
      this._editingUser?.emailVerified ?? false,
      {
        nonNullable: true,
      },
    ),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(8)],
    }),
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

  public toggleRoleSelection(
    roleId: number,
    checked: boolean,
  ): void {
    this.selectedRoleIds.update(
      (currentRoleIds: number[]): number[] => {
        if (checked) {
          return Array.from(
            new Set([...currentRoleIds, roleId]),
          );
        }

        return currentRoleIds.filter(
          (candidateRoleId: number): boolean =>
            candidateRoleId !== roleId,
        );
      },
    );
  }

  public isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds().includes(roleId);
  }

  public onRoleCheckboxChange(
    roleId: number,
    event: Event,
  ): void {
    const target = event.target as HTMLInputElement;
    this.toggleRoleSelection(roleId, target.checked);
  }

  public saveUser(): void {
    trimControls(this.userForm, ['name', 'email', 'image']);

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.getRawValue();
    const payload: UserUpsertPayload = {
      name: formValue.name.trim(),
      email: formValue.email.trim(),
      emailVerified: formValue.emailVerified,
      image: formValue.image.trim() || undefined,
      role: formValue.canManageUsersPermissions
        ? 'admin'
        : 'user',
      roleIds: this.selectedRoleIds(),
    };

    this.isSavingUser.set(true);

    if (this.mode === 'create') {
      if (!formValue.password) {
        this.isSavingUser.set(false);
        this._toast.warning(
          'Password is required for new users.',
        );
        return;
      }

      payload.password = formValue.password;
      this._adminService
        .createUser(payload)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: (): void => {
            this.isSavingUser.set(false);
            this._toast.success(
              'User created successfully.',
            );
            this._dialogRef.close({ saved: true });
          },
          error: (error: unknown): void => {
            this.isSavingUser.set(false);
            this._toast.error(
              this._extractErrorMessage(
                error,
                'Unable to create user.',
              ),
            );
          },
        });
      return;
    }

    const editingUser = this._editingUser;
    if (!editingUser) {
      this.isSavingUser.set(false);
      this._toast.error('Missing user data.');
      return;
    }

    this._adminService
      .updateUser(editingUser.id, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSavingUser.set(false);
          this._toast.success('User updated successfully.');
          this._dialogRef.close({ saved: true });
        },
        error: (error: unknown): void => {
          this.isSavingUser.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to update user.',
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
      this.saveUser();
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
