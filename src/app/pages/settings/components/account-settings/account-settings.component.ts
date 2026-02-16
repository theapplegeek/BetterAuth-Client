import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AccountSecurityService } from '../../../../common/auth/account-security.service';
import { ToastService } from '../../../../common/services/toast.service';
import { UserService } from '../../../../common/user/user.service';
import { User } from '../../../../common/user/models/user.type';

@Component({
  selector: 'app-account-settings',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
})
export class AccountSettingsComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _accountSecurityService: AccountSecurityService =
    inject(AccountSecurityService);
  private readonly _userService: UserService =
    inject(UserService);
  private readonly _toast: ToastService =
    inject(ToastService);

  public readonly user = computed((): User | undefined =>
    this._userService.user(),
  );
  public readonly isLoadingSession: WritableSignal<boolean> =
    signal<boolean>(true);
  public readonly isSavingName: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isSavingEmail: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isDeletingAccount: WritableSignal<boolean> =
    signal<boolean>(false);

  public readonly profileForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(120),
      ],
    }),
  });
  public readonly emailForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(255),
      ],
    }),
  });
  public readonly deleteForm = new FormGroup({
    confirmationEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  constructor() {
    this.loadSession();
  }

  public loadSession(): void {
    this.isLoadingSession.set(true);

    this._accountSecurityService
      .refreshSession()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this._patchForms();
          this.isLoadingSession.set(false);
        },
        error: (error: unknown): void => {
          this.isLoadingSession.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to load profile information.',
            ),
          );
        },
      });
  }

  public saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const currentUser: User | undefined = this.user();
    if (!currentUser) return;

    const nextName: string =
      this.profileForm.controls.name.value.trim();
    if (!nextName || nextName === currentUser.name) return;

    this.isSavingName.set(true);
    this._accountSecurityService
      .updateUserName(nextName)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSavingName.set(false);
          this._toast.success(
            'Username updated successfully.',
          );
          this.loadSession();
        },
        error: (error: unknown): void => {
          this.isSavingName.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to update username.',
            ),
          );
        },
      });
  }

  public saveEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const currentUser: User | undefined = this.user();
    if (!currentUser) return;

    const nextEmail: string =
      this.emailForm.controls.email.value.trim();
    if (!nextEmail || nextEmail === currentUser.email)
      return;

    this.isSavingEmail.set(true);
    this._accountSecurityService
      .changeEmail(
        nextEmail,
        `${window.location.origin}/redirect-to-home`,
      )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSavingEmail.set(false);
          this._toast.success(
            'Verification email sent. Confirm your new address from inbox.',
          );
        },
        error: (error: unknown): void => {
          this.isSavingEmail.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to request email update.',
            ),
          );
        },
      });
  }

  public deleteAccount(): void {
    const currentUser: User | undefined = this.user();
    if (!currentUser) return;

    if (this.deleteForm.invalid) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    const confirmationEmail: string =
      this.deleteForm.controls.confirmationEmail.value.trim();
    if (confirmationEmail !== currentUser.email) {
      this._toast.warning(
        'Email confirmation does not match your account email.',
      );
      return;
    }

    this.isDeletingAccount.set(true);
    this._accountSecurityService
      .deleteAccount(
        `${window.location.origin}/redirect-to-sign-in`,
      )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isDeletingAccount.set(false);
          this.deleteForm.reset({
            confirmationEmail: '',
          });
          this._toast.success(
            'Account deletion confirmation email sent. Complete the verification from your inbox.',
          );
        },
        error: (error: unknown): void => {
          this.isDeletingAccount.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to start account deletion.',
            ),
          );
        },
      });
  }

  private _patchForms(): void {
    const currentUser: User | undefined = this.user();
    if (!currentUser) return;

    this.profileForm.patchValue({
      name: currentUser.name ?? '',
    });
    this.emailForm.patchValue({
      email: currentUser.email ?? '',
    });
    this.deleteForm.patchValue({
      confirmationEmail: '',
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
