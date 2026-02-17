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
import { AdminUser } from '../../../../../../common/admin/models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type UserBanDialogData = {
  user: AdminUser;
};

export type UserBanDialogResult = {
  banned: boolean;
};

@Component({
  selector: 'app-user-ban-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './user-ban-dialog.component.html',
})
export class UserBanDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    UserBanDialogResult,
    UserBanDialogComponent
  > = inject(
    DialogRef<UserBanDialogResult, UserBanDialogComponent>,
  );
  private readonly _data: UserBanDialogData =
    inject(DIALOG_DATA);

  public readonly user: AdminUser = this._data.user;
  public readonly isSavingBan: WritableSignal<boolean> =
    signal<boolean>(false);

  public readonly banForm = new FormGroup({
    reason: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
      ],
    }),
    durationHours: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0)],
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

  public banUser(): void {
    if (this.banForm.invalid) {
      this.banForm.markAllAsTouched();
      return;
    }

    const durationHours: number =
      this.banForm.controls.durationHours.value;
    const expiresInSeconds: number | undefined =
      durationHours > 0
        ? Math.round(durationHours * 3600)
        : undefined;

    this.isSavingBan.set(true);
    this._adminService
      .banUser(
        this.user.id,
        this.banForm.controls.reason.value.trim(),
        expiresInSeconds,
      )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSavingBan.set(false);
          this._toast.success('User banned successfully.');
          this._dialogRef.close({ banned: true });
        },
        error: (error: unknown): void => {
          this.isSavingBan.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to ban user.',
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
      this.banUser();
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
