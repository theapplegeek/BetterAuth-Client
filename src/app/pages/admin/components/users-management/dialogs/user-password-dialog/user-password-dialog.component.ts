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
import { AdminUser } from '../../../../../../common/admin/models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type UserPasswordDialogData = {
  user: AdminUser;
};

export type UserPasswordDialogResult = {
  saved: boolean;
};

@Component({
  selector: 'app-user-password-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './user-password-dialog.component.html',
})
export class UserPasswordDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminService =
    inject(AdminService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    UserPasswordDialogResult,
    UserPasswordDialogComponent
  > = inject(
    DialogRef<
      UserPasswordDialogResult,
      UserPasswordDialogComponent
    >,
  );
  private readonly _data: UserPasswordDialogData =
    inject(DIALOG_DATA);

  public readonly user: AdminUser = this._data.user;
  public readonly isSavingPassword: WritableSignal<boolean> =
    signal<boolean>(false);

  public readonly passwordForm = new FormGroup({
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
      ],
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

  public savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword.set(true);
    this._adminService
      .setUserPassword(
        this.user.id,
        this.passwordForm.controls.newPassword.value,
      )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSavingPassword.set(false);
          this._toast.success('Password updated.');
          this._dialogRef.close({ saved: true });
        },
        error: (error: unknown): void => {
          this.isSavingPassword.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to set password.',
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
      this.savePassword();
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
